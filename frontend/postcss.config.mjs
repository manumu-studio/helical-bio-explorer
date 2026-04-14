// PostCSS pipeline for Next.js: enables Tailwind CSS v4 via the official PostCSS plugin.

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
