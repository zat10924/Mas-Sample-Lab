/** @type {import('tailwindcss').Config} */
// ألوان هوية MAS (مارون + ذهبي). القيم الفعلية في src/index.css كمتغيرات CSS
// عشان الوضع الليلي يشتغل زي برنامج المصنع بالظبط.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tajawal', 'system-ui', '-apple-system', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
      colors: {
        page: 'var(--bg)',
        surface: 'var(--card)',
        ink: 'var(--ink)',
        mute: 'var(--mute)',
        faint: 'var(--faint)',
        line: 'var(--line)',
        tint: 'var(--tint)',
        brand: {
          50: 'var(--b50)',
          100: 'var(--b100)',
          600: 'var(--b600)',
          700: 'var(--pri)',
          800: 'var(--pri-d)',
          900: 'var(--b900)',
        },
        gold: {
          DEFAULT: 'var(--gold)',
          light: 'var(--gold-l)',
        },
      },
    },
  },
  plugins: [],
}
