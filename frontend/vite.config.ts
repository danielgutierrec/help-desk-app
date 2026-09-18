import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiPort = process.env.VITE_API_PORT ?? '5112'
const uiPort = process.env.VITE_UI_PORT ?? '5173'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: Number(uiPort),
    strictPort: true,
    proxy: {
      '/api': `http://localhost:${apiPort}`,
    },
  },
})
