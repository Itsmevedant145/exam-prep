import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  preview: {
    // Allow Render's public domain
    allowedHosts: true,   // <-- allows all hosts (best for Render)
    host: true,           // <-- needed so it binds to 0.0.0.0
    port: process.env.PORT || 5173
  }
})
