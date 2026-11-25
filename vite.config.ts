import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' = الملفات بمسارات نسبية، فنفس البناء يشتغل على:
//   https://zat10924.github.io/mas-sample-lab/   (GitHub Pages - نفس دومين برنامج المصنع)
//   أو أي استضافة تانية (Vercel...).
// مفيش Service Worker هنا عمدًا: برنامج المصنع عنده sw.js على جذر الدومين وبيغطي المختبر،
// وتسجيل SW تاني كان هيتعارض معاه.
export default defineConfig({
  base: './',
  plugins: [react()],
})
