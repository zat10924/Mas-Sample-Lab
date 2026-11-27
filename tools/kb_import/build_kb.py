#!/usr/bin/env python3
"""
MAS LAB — استيراد الموسوعة (ملفات Word) إلى ملفات SQL قابلة لإعادة التشغيل.

الاستخدام:
    pip install python-docx
    python tools/kb_import/build_kb.py <مجلد فيه ملفات docx> [مجلد الإخراج]

المخرجات (لا يتصل بأي شبكة ولا بأي قاعدة بيانات):
    supabase/migrations/011_kb_import_vol1.sql
    supabase/migrations/012_kb_import_vol2.sql
    supabase/migrations/013_kb_import_vol3.sql
    tools/kb_import/import_report.md   تقرير الأعداد والتحقق
    tools/kb_import/import_data.json   البيانات المستخرجة (للمراجعة)

مبادئ:
    * منع التكرار: مفاتيح ثابتة (doc_key + chapter_key + seq) و ON CONFLICT DO UPDATE.
    * التحقق: يقارن مجموع كلمات الملف الأصلي بمجموع كلمات المقاطع المستخرجة، ويبلّغ عن أي فرق.
    * ملف SQL ينتهي باختبار عدّ داخل نفس الـ transaction: لو العدد غير مطابق يتراجع كل شيء.
    * لا يحذف أي شيء من الملفات الأصلية ولا من قاعدة البيانات.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path

import docx
from docx.table import Table
from docx.text.paragraph import Paragraph

VOLUMES = [
    # doc_key, file name, edition, volume
    ("vol1", "MAS_LAB_Porcelain_Encyclopedia_AR_v1.docx", "v1", 1,
     "موسوعة علوم وتكنولوجيا البورسلين — المجلد الأول", "011_kb_import_vol1.sql"),
    ("vol2", "MAS_LAB_Porcelain_Encyclopedia_Vol2_AR.docx", "v1", 2,
     "موسوعة علوم وتكنولوجيا البورسلين — المجلد الثاني", "012_kb_import_vol2.sql"),
    ("vol3", "MAS_LAB_Porcelain_Encyclopedia_Vol3_AR.docx", "v1", 3,
     "موسوعة علوم وتكنولوجيا البورسلين — المجلد الثالث", "013_kb_import_vol3.sql"),
]

# ربط رقم الفصل بالباب (متفق عليه مع المالك في المرحلة B)
CATEGORY_BY_CHAPTER = {
    1: 1,
    2: 2, 19: 2, 20: 2, 33: 2,
    3: 3, 34: 3,
    4: 4, 21: 4, 22: 4,
    5: 5, 6: 5,
    7: 6, 8: 6, 39: 6,
    9: 7, 10: 7, 25: 7, 35: 7,
    11: 8, 27: 8, 36: 8,
    12: 9,
    13: 10, 37: 10,
    14: 11, 26: 11, 38: 11,
    15: 12, 23: 12, 24: 12,
    16: 13, 29: 13, 30: 13,
    17: 14, 28: 14, 41: 14,
    18: 15, 40: 15,
    31: 16, 32: 16, 42: 16, 43: 16, 44: 16,
}
# فصول غير مرقّمة (مقدمات وملاحق) -> باب
CATEGORY_BY_TITLE = [
    ("مقدمة وحدود الاستخدام", 1),
    ("فهرس الأبواب", 16),
    ("قاموس", 16),
    ("المراجع", 16),
    ("مراجع", 16),
    ("متطلبات سلامة المنتج", 14),
    ("خطة إدخال الموسوعة", 16),
    ("كيفية استخدام المجلد", 16),
    ("ملاحظة تحريرية", 16),
    ("تنبيه ختامي", 16),
]

CH_PATTERNS = [
    re.compile(r"^\s*الفصل\s+(\d+)\s*[—:\-–]\s*(.+)$"),
    re.compile(r"^\s*(\d+)\.\s+(.+)$"),
]


def sha256_file(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def h(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()


def cell_text(cell) -> str:
    return " ".join(p.text.strip() for p in cell.paragraphs if p.text.strip()).replace("|", "/")


def table_to_markdown(t: Table, warnings: list[str], where: str) -> str:
    rows = []
    for ri, row in enumerate(t.rows):
        tcs = {id(c._tc) for c in row.cells}
        if len(tcs) != len(row.cells):
            warnings.append(f"{where}: خلايا مدموجة في الصف {ri + 1} (تم الاحتفاظ بالنص مرة واحدة)")
        seen, vals = set(), []
        for c in row.cells:
            if id(c._tc) in seen:
                continue
            seen.add(id(c._tc))
            if c._tc.xpath(".//w:tbl"):
                warnings.append(f"{where}: جدول متداخل داخل خلية في الصف {ri + 1} (لم يُستخرج المتداخل)")
            vals.append(cell_text(c))
        rows.append(vals)
    if not rows:
        return ""
    width = max(len(r) for r in rows)
    rows = [r + [""] * (width - len(r)) for r in rows]
    out = ["| " + " | ".join(rows[0]) + " |", "| " + " | ".join(["---"] * width) + " |"]
    out += ["| " + " | ".join(r) + " |" for r in rows[1:]]
    return "\n".join(out)


def category_for(chapter_no, title):
    if chapter_no is not None:
        return CATEGORY_BY_CHAPTER.get(chapter_no)
    for key, cat in CATEGORY_BY_TITLE:
        if title.startswith(key):
            return cat
    return 16


def parse_heading(title: str):
    for pat in CH_PATTERNS:
        m = pat.match(title)
        if m:
            return int(m.group(1)), m.group(2).strip()
    return None, title.strip()


def words(text: str) -> list[str]:
    """كلمات للمقارنة: نتجاهل علامات الجداول والترقيم."""
    return re.findall(r"[\w\u0600-\u06FF]+", text.lower())


def parse_volume(path: Path, doc_key: str):
    d = docx.Document(str(path))
    warnings: list[str] = []
    chapters: list[dict] = []
    cur = None
    cur_sec = None
    pending_list: list[str] = []
    all_words: Counter = Counter()
    n_tables_found = 0

    def ensure_chapter_for_orphans():
        nonlocal cur, cur_sec
        if cur is None:
            cur = {"key": "front-0", "no": None, "raw": "", "title": "غلاف المجلد", "sections": [{"seq": 0, "heading": None}], "chunks": []}
            cur_sec = cur["sections"][0]
            chapters.append(cur)
            warnings.append("غلاف المجلد (محتوى قبل أول عنوان): حُفظ كفصل 'front-0'")

    def flush_list():
        nonlocal pending_list
        if pending_list and cur is not None:
            add_chunk("list", "\n".join(pending_list))
        pending_list = []

    def heading_path():
        parts = [cur["title"]]
        if cur_sec and cur_sec["heading"]:
            parts.append(cur_sec["heading"])
        return " › ".join(parts)

    def add_chunk(kind, content):
        content = content.strip()
        if not content:
            return
        cur["chunks"].append({
            "seq": len(cur["chunks"]) + 1,
            "kind": kind,
            "sec_seq": cur_sec["seq"] if cur_sec else 0,
            "heading_path": heading_path(),
            "content": content,
            "hash": h(content),
        })

    for el in d.element.body.iterchildren():
        tag = el.tag.split("}")[1]
        if tag == "p":
            p = Paragraph(el, d)
            txt = p.text.strip()
            style = p.style.name
            for w in words(p.text):
                all_words[w] += 1
            if not txt:
                continue
            if style == "Heading 1":
                flush_list()
                no, title = parse_heading(txt)
                key = f"ch-{no}" if no is not None else f"x-{h(title)[:8]}"
                cur = {"key": key, "no": no, "raw": txt, "title": title, "sections": [{"seq": 0, "heading": None}], "chunks": []}
                cur_sec = cur["sections"][0]
                chapters.append(cur)
            elif style == "Heading 2":
                flush_list()
                ensure_chapter_for_orphans()
                cur_sec = {"seq": len(cur["sections"]), "heading": txt}
                cur["sections"].append(cur_sec)
            elif style in ("List Bullet", "List Number"):
                ensure_chapter_for_orphans()
                prefix = "- " if style == "List Bullet" else f"{len(pending_list) + 1}. "
                pending_list.append(prefix + txt)
            else:
                flush_list()
                ensure_chapter_for_orphans()
                add_chunk("paragraph", txt)
        elif tag == "tbl":
            flush_list()
            ensure_chapter_for_orphans()
            t = Table(el, d)
            n_tables_found += 1
            for row in t.rows:
                seen = set()
                for c in row.cells:
                    if id(c._tc) in seen:
                        continue
                    seen.add(id(c._tc))
                    for w in words(c.text):
                        all_words[w] += 1
            md = table_to_markdown(t, warnings, f"{doc_key}/{cur['key']}")
            add_chunk("table", md)
            cur["chunks"][-1]["rows"] = len(t.rows)
        elif tag in ("sectPr",):
            pass
        else:
            warnings.append(f"عنصر غير معروف في الملف: {tag}")
    flush_list()

    # عناصر قد لا تُستخرج
    xml = d.element.xml
    for marker, label in (("w:txbxContent", "مربعات نص"), ("w:drawing", "رسومات/صور"), ("w:footnoteReference", "حواشي")):
        c = xml.count(marker)
        if c:
            warnings.append(f"يوجد {c} من {label} داخل الملف (غير مستخرج)")
    for sec in d.sections:
        ht = " ".join(p.text for p in sec.header.paragraphs).strip()
        ft = " ".join(p.text for p in sec.footer.paragraphs).strip()
        if ht or ft:
            warnings.append(f"رأس/تذييل صفحة غير مستخرج: «{(ht + ' ' + ft).strip()[:80]}»")
            break

    # تحقق من الاكتمال: نفس الكلمات في المقاطع
    chunk_words: Counter = Counter()
    for ch in chapters:
        for w in words(ch.get("raw", ch["title"])):
            chunk_words[w] += 1
        for s in ch["sections"]:
            if s["heading"]:
                for w in words(s["heading"]):
                    chunk_words[w] += 1
        for c in ch["chunks"]:
            body = c["content"]
            if c["kind"] == "table":
                body = body.replace("| --- ", "").replace("---", "")
            # ترقيم القوائم المضاف لا يعدّ نصًا أصليًا
            if c["kind"] == "list":
                body = re.sub(r"(?m)^(- |\d+\. )", "", body)
            for w in words(body):
                chunk_words[w] += 1
    # أرقام الترقيم المضافة لقوائم List Number تُحذف بالـ regex أعلاه
    missing = all_words - chunk_words
    extra = chunk_words - all_words
    return chapters, warnings, n_tables_found, sum(missing.values()), dict(list(missing.items())[:10]), dict(list(extra.items())[:10])


# ------------------------------------------------------------------ SQL
def q(s) -> str:
    if s is None:
        return "null"
    if "$kb$" in s:
        raise ValueError("النص يحتوي على $kb$")
    return f"$kb${s}$kb$"


def extract_terms_and_sources(chapters, doc_key):
    terms, sources = [], []
    for ch in chapters:
        title = ch["title"]
        is_glossary = title.startswith("قاموس")
        is_refs = title.startswith("المراجع") or title.startswith("مراجع")
        for c in ch["chunks"]:
            if is_glossary and c["kind"] == "table":
                lines = c["content"].split("\n")[2:]
                header = c["content"].split("\n")[0]
                for ln in lines:
                    cells = [x.strip() for x in ln.strip("|").split(" | ")]
                    if len(cells) < 2:
                        continue
                    a, b = cells[0].strip(), cells[1].strip()
                    if "English" in header:  # عربي | English
                        terms.append({"ar": a, "en": b, "note": None, "chapter": ch["key"]})
                    else:  # مصطلح إنجليزي | شرح عربي
                        terms.append({"ar": None, "en": a, "note": b, "chapter": ch["key"]})
            if is_refs and c["kind"] in ("paragraph", "list"):
                for ln in c["content"].split("\n"):
                    ln = re.sub(r"^(- |\d+\. )", "", ln).strip()
                    if not ln:
                        continue
                    m = re.search(r"https?://\S+", ln)
                    url = m.group(0) if m else None
                    ttl = ln.replace(url, "").rstrip(" —-").strip() if url else ln
                    sources.append({"title": ttl, "url": url, "chapter": ch["key"]})
    return terms, sources


def volume_sql(doc_key, fname, edition, volume, title, sha, chapters, warnings, counts):
    L = []
    w = L.append
    w(f"-- =====================================================================")
    w(f"-- استيراد {title}")
    w(f"-- الملف الأصلي: {fname}  (SHA-256: {sha[:16]}…)")
    w(f"-- مولَّد آليًا بواسطة tools/kb_import/build_kb.py — آمن لإعادة التشغيل (بدون تكرار).")
    w(f"-- يتطلب تشغيل 009_kb_schema.sql أولًا. لا يمسّ أي جدول قديم.")
    w(f"-- =====================================================================")
    w("begin;")
    w("")
    w("insert into public.lab_kb_documents (doc_key, title, edition, volume, file_name, file_sha256)")
    w(f"values ({q(doc_key)}, {q(title)}, {q(edition)}, {volume}, {q(fname)}, {q(sha)})")
    w("on conflict (doc_key) do update set title = excluded.title, edition = excluded.edition,")
    w("  file_name = excluded.file_name, file_sha256 = excluded.file_sha256, imported_at = now();")
    w("")
    for i, ch in enumerate(chapters, 1):
        cat = category_for(ch["no"], ch["title"])
        w(f"-- ---- {ch['key']}: {ch['title']}")
        w("insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)")
        w(f"select d.id, {q(ch['key'])}, {ch['no'] if ch['no'] is not None else 'null'}, {q(ch['title'])}, {cat}, {i}")
        w(f"from public.lab_kb_documents d where d.doc_key = {q(doc_key)}")
        w("on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,")
        w("  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;")
        secs = ",\n  ".join(f"({s['seq']}, {q(s['heading'])})" for s in ch["sections"])
        w("insert into public.lab_kb_sections (chapter_id, seq, heading)")
        w("select c.id, v.seq, v.heading from (values")
        w(f"  {secs}")
        w(") as v(seq, heading)")
        w(f"join public.lab_kb_chapters c on c.chapter_key = {q(ch['key'])}")
        w(f"  and c.document_id = (select id from public.lab_kb_documents where doc_key = {q(doc_key)})")
        w("on conflict (chapter_id, seq) do update set heading = excluded.heading;")
        if ch["chunks"]:
            rows = ",\n  ".join(
                f"({c['seq']}, {c['sec_seq']}, {q(c['kind'])}, {q(c['heading_path'])}, {q(c['content'])}, {q(c['hash'])})"
                for c in ch["chunks"]
            )
            w("insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)")
            w("select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values")
            w(f"  {rows}")
            w(") as v(seq, sec_seq, kind, heading_path, content, content_hash)")
            w(f"join public.lab_kb_chapters c on c.chapter_key = {q(ch['key'])}")
            w(f"  and c.document_id = (select id from public.lab_kb_documents where doc_key = {q(doc_key)})")
            w("join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq")
            w("on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,")
            w("  heading_path = excluded.heading_path, content = excluded.content,")
            w("  content_hash = excluded.content_hash, is_current = true;")
            # لو الإصدار الجديد أقصر: لا نحذف، نعلّم القديم بأنه غير حالي
            w(f"update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c")
            w(f"where k.chapter_id = c.id and c.chapter_key = {q(ch['key'])}")
            w(f"  and c.document_id = (select id from public.lab_kb_documents where doc_key = {q(doc_key)})")
            w(f"  and k.seq > {len(ch['chunks'])};")
        w("")

    terms, sources = extract_terms_and_sources(chapters, doc_key)
    counts["terms"], counts["sources"] = len(terms), len(sources)
    if terms:
        rows = ",\n  ".join(
            f"({q(hashlib.sha1(((t['ar'] or '') + '|' + (t['en'] or '')).lower().encode()).hexdigest()[:16])}, "
            f"{q(t['ar'])}, {q(t['en'])}, {q(t['note'])}, {q(t['chapter'])})"
            for t in terms
        )
        w("-- ---- القاموس (مصطلحات عربي/إنجليزي)")
        w("insert into public.lab_kb_terms (term_key, ar, en, note, source_chapter_key, document_id)")
        w(f"select v.term_key, v.ar, v.en, v.note, v.ck, (select id from public.lab_kb_documents where doc_key = {q(doc_key)}) from (values")
        w(f"  {rows}")
        w(") as v(term_key, ar, en, note, ck)")
        w("on conflict (term_key) do update set ar = excluded.ar, en = excluded.en, note = excluded.note;")
        w("")
    if sources:
        rows = ",\n  ".join(
            f"({q(hashlib.sha1(((s['url'] or '') + s['title']).encode()).hexdigest()[:16])}, {q(s['title'])}, {q(s['url'])}, {q(s['chapter'])})"
            for s in sources
        )
        w("-- ---- المراجع والمعايير")
        w("insert into public.lab_kb_sources (source_key, title, url, source_chapter_key, document_id)")
        w(f"select v.source_key, v.title, v.url, v.ck, (select id from public.lab_kb_documents where doc_key = {q(doc_key)}) from (values")
        w(f"  {rows}")
        w(") as v(source_key, title, url, ck)")
        w("on conflict (source_key) do update set title = excluded.title, url = excluded.url;")
        w("")

    # سجل الاستيراد + اختبار العدّ (يتراجع كل شيء لو لم يتطابق)
    n_ch, n_sec, n_chunks = counts["chapters"], counts["sections"], counts["chunks"]
    w("-- ---- سجل الاستيراد")
    w("insert into public.lab_kb_import_jobs (doc_key, file_name, file_sha256, status, chapters_count, sections_count,")
    w("  chunks_count, tables_count, terms_count, sources_count, warnings)")
    w(f"values ({q(doc_key)}, {q(fname)}, {q(sha)}, 'completed', {n_ch}, {n_sec}, {n_chunks}, {counts['tables']},")
    w(f"  {counts['terms']}, {counts['sources']}, {q(json.dumps(warnings, ensure_ascii=False))}::jsonb);")
    w("")
    w("-- ---- اختبار الاكتمال: لو أي عدد غير مطابق يحدث خطأ ويتراجع الاستيراد كله")
    w("do $verify$")
    w("declare v_ch int; v_sec int; v_chunks int; v_tables int;")
    w("begin")
    w("  select count(*) into v_ch from public.lab_kb_chapters c join public.lab_kb_documents d on d.id = c.document_id")
    w(f"    where d.doc_key = {q(doc_key)};")
    w("  select count(*) into v_sec from public.lab_kb_sections s join public.lab_kb_chapters c on c.id = s.chapter_id")
    w(f"    join public.lab_kb_documents d on d.id = c.document_id where d.doc_key = {q(doc_key)};")
    w("  select count(*), count(*) filter (where k.kind = 'table') into v_chunks, v_tables")
    w("    from public.lab_kb_chunks k join public.lab_kb_chapters c on c.id = k.chapter_id")
    w(f"    join public.lab_kb_documents d on d.id = c.document_id where d.doc_key = {q(doc_key)} and k.is_current;")
    w(f"  if v_ch <> {n_ch} or v_sec <> {n_sec} or v_chunks <> {n_chunks} or v_tables <> {counts['tables']} then")
    w(f"    raise exception 'KB import mismatch: chapters %/{n_ch}, sections %/{n_sec}, chunks %/{n_chunks}, tables %/{counts['tables']}', v_ch, v_sec, v_chunks, v_tables;")
    w("  end if;")
    w("end $verify$;")
    w("")
    w("commit;")
    return "\n".join(L) + "\n"


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = Path(sys.argv[1])
    root = Path(__file__).resolve().parents[2]
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else root / "supabase" / "migrations"
    report = ["# تقرير استيراد الموسوعة\n", "(مولَّد آليًا من build_kb.py)\n"]
    data = {}
    total = Counter()
    for doc_key, fname, edition, volume, title, sqlname in VOLUMES:
        path = src / fname
        if not path.exists():
            print(f"ملف ناقص: {path}")
            sys.exit(2)
        sha = sha256_file(path)
        chapters, warnings, n_tbl_found, missing, missing_sample, extra = parse_volume(path, doc_key)
        # نتحقق أن عدد الجداول في الملف = عدد جداول المقاطع
        n_tbl_chunks = sum(1 for c in chapters for k in c["chunks"] if k["kind"] == "table")
        if n_tbl_found != n_tbl_chunks:
            warnings.append(f"عدد الجداول المستخرجة {n_tbl_chunks} ≠ الموجودة {n_tbl_found}")
        counts = {
            "chapters": len(chapters),
            "sections": sum(len(c["sections"]) for c in chapters),
            "chunks": sum(len(c["chunks"]) for c in chapters),
            "tables": n_tbl_chunks,
        }
        sql = volume_sql(doc_key, fname, edition, volume, title, sha, chapters, warnings, counts)
        (out_dir / sqlname).write_text(sql, encoding="utf-8")
        data[doc_key] = {"file": fname, "sha256": sha, "counts": counts, "chapters": chapters, "warnings": warnings}
        for k, v in counts.items():
            total[k] += v
        numbered = [c["no"] for c in chapters if c["no"] is not None]
        report += [
            f"\n## {title}\n",
            f"- الملف: `{fname}` — SHA-256: `{sha}`",
            f"- الفصول/الوحدات: **{counts['chapters']}** (مرقّمة: {len(numbered)} من {min(numbered)} إلى {max(numbered)})",
            f"- الأقسام: **{counts['sections']}** — المقاطع: **{counts['chunks']}** — الجداول: **{counts['tables']}** (في الملف الأصلي: {n_tbl_found})",
            f"- المصطلحات: **{counts['terms']}** — المراجع: **{counts['sources']}**",
            f"- كلمات في الأصل ولم تظهر في المقاطع: **{missing}** {missing_sample if missing else ''}",
            f"- كلمات زائدة في المقاطع: **{sum(extra.values())}** {extra if extra else ''}",
            f"- التحذيرات: {len(warnings)}",
        ]
        report += [f"  - {w_}" for w_ in warnings]
        report.append("\n| # | المفتاح | العنوان | أقسام | مقاطع |\n|---|---|---|---|---|")
        for i, c in enumerate(chapters, 1):
            report.append(f"| {i} | {c['key']} | {c['title']} | {len(c['sections'])} | {len(c['chunks'])} |")
        total["terms"] += counts["terms"]
        total["sources"] += counts["sources"]
    # فحص الاكتمال عبر المجلدات: كل فصل من 1 إلى 44 موجود مرة واحدة
    all_nos = [c["no"] for v in data.values() for c in v["chapters"] if c["no"] is not None]
    dup = [n for n, k in Counter(all_nos).items() if k > 1]
    missing_nos = [n for n in range(1, max(all_nos) + 1) if n not in all_nos]
    report += [
        "\n## الإجمالي\n",
        f"- الفصول/الوحدات: **{total['chapters']}** — الأقسام: **{total['sections']}** — المقاطع: **{total['chunks']}** — الجداول: **{total['tables']}**",
        f"- المصطلحات: **{total['terms']}** — المراجع: **{total['sources']}**",
        f"- الفصول المرقمة 1–{max(all_nos)}: مفقود = {missing_nos or 'لا يوجد'} — مكرر = {dup or 'لا يوجد'}",
    ]
    (root / "tools" / "kb_import" / "import_report.md").write_text("\n".join(report) + "\n", encoding="utf-8")
    (root / "tools" / "kb_import" / "import_data.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print("\n".join(report[:2]))
    print(f"فصول={total['chapters']} أقسام={total['sections']} مقاطع={total['chunks']} جداول={total['tables']} "
          f"مصطلحات={total['terms']} مراجع={total['sources']} مفقود={missing_nos} مكرر={dup}")


if __name__ == "__main__":
    main()
