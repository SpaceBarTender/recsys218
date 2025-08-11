import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//export default defineConfig({
//  plugins: [react()],
//  server: {
//    proxy: {
//      '/api': {
//        target: 'http://127.0.0.1:5000',
//        changeOrigin: true,
//        rewrite: (path) => path.replace(/^\/api/, ''),
//      },
//    },
//  },
//});
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', //'http://localhost', 'http://backend:5000', 'https://recsys218.azurewebsites.us'
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
