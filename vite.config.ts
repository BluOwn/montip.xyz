import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Ensure the _redirects file is copied to the dist folder
const copyRedirects = () => {
  return {
    name: 'copy-redirects',
    writeBundle() {
      // Create _redirects file in the dist folder
      fs.writeFileSync(
        path.resolve(__dirname, 'dist', '_redirects'),
        '/* /index.html 200'
      )
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyRedirects()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})