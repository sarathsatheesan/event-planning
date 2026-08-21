import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves a project site from https://<user>.github.io/<repo>/,
// so production assets need that sub-path as their base. The deploy workflow
// sets BASE_PATH from the repo name; local dev and preview stay at '/'.
// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? process.env.BASE_PATH || '/' : '/',
}))
