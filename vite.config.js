import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      // Enable JSX transform for .js/.jsx/.ts/.tsx
      include: [/\.[jt]sx?$/],
    }),
  ],
});
