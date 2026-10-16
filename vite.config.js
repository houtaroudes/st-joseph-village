import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 5330 is this project's slot in the local port band, so it can run beside the
  // others. strictPort means a taken port fails loudly instead of quietly
  // moving somewhere a check is not looking.
  server: { port: 5330, strictPort: true },
})
