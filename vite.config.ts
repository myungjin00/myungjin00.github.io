import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// User/organization Pages (myungjin00.github.io) are served from the domain root,
// so the base path stays '/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
})
