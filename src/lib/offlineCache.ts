/** مفتاح التخزين المحلي لنسخة البيانات اللي بتفضل متاحة بدون إنترنت */
export const CACHE_KEY = 'mas-lab-cache'
/** غيّر الرقم ده لو شكل البيانات المخزّنة اتغيّر، والنسخة القديمة هتتمسح لوحدها */
export const CACHE_VERSION = 'v1'
export const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000
