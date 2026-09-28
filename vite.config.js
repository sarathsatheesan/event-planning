import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Firebase Hosting serves the app at the root of icceventops.web.app, so no
// sub-path prefix is needed. (GitHub Pages served it from /event-planning/,
// which is why this used to read BASE_PATH from the Actions workflow.)
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
})
