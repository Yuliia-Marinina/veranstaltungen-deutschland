import { defineConfig } from 'vite';

export default defineConfig({
  base: '/veranstaltungen-deutschland/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        detail: 'event-detail.html',
      },
    },
  },
});
