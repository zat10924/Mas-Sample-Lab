/** مفتاح الكاش القديم (localStorage). النسخة الجديدة على IndexedDB وبتتمسح النسخة القديمة عند الفتح */
export const CACHE_KEY = 'mas-lab-cache'
/** غيّر الرقم ده لو شكل البيانات المخزّنة اتغيّر، والنسخة القديمة هتتمسح لوحدها */
export const CACHE_VERSION = 'v2'
/** 14 يوم. (مهم: ما نتعداش ~24 يوم لأن مؤقّتات المتصفح بتفشل بعد كده) */
export const CACHE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000
