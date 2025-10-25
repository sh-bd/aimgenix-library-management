import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Ensure this is NOT 'es2015'
    target: 'esnext', // Or remove this line completely
    // ...
  }
})
