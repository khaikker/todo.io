import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/todo.io/',
  plugins: [
    react({
      // Enable JSX transform for .js/.jsx/.ts/.tsx
      include: [/\.[jt]sx?$/],
    }),
  ],
});
