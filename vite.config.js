import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        space: resolve(__dirname, 'space-shooter-game.html'),
        candy: resolve(__dirname, 'candy-car-game.html'),
        jump: resolve(__dirname, 'jump-game.html'),
        // Add ALL HTML files here
      },
    },
  },
});