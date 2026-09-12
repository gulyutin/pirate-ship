import { defineConfig } from 'vite';

// base './' — относительные пути в сборке: она откроется на GitHub Pages
// по адресу https://<user>.github.io/<repo>/ при любом имени репозитория.
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 900, // three.js целиком ~550 КБ, это нормально
  },
});
