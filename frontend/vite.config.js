import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em desenvolvimento, a API (porta 5000) é acessada pelo mesmo domínio do frontend
const proxy = {
  '/api': { target: process.env.VITE_API_PROXY || 'http://localhost:5000', changeOrigin: true },
  '/api-docs': { target: process.env.VITE_API_PROXY || 'http://localhost:5000', changeOrigin: true }
};

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, proxy },
  preview: { port: 3000, proxy }
});
