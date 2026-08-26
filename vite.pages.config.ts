import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';

export default defineConfig({
  root:'github-pages-src',
  base:'./',
  publicDir:'../public',
  css:{postcss:{plugins:[tailwindcss()]}},
  plugins:[react()],
  build:{outDir:'../pages-dist',emptyOutDir:true},
});
