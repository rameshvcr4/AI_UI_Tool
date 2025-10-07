// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/AI_UI_Tool/'   // IMPORTANT for GitHub Pages when repo name is AI_UI_Tool
})
