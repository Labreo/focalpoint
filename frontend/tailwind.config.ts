import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#050811',
        card: 'rgba(15, 23, 42, 0.85)',
        amber: {
          highlight: '#FDE047',
          glow: 'rgba(253, 224, 71, 0.25)',
        },
        cyan: {
          highlight: '#38BDF8',
          glow: 'rgba(56, 189, 248, 0.25)',
        },
        mint: {
          highlight: '#4ADE80',
          glow: 'rgba(74, 222, 128, 0.25)',
        }
      },
      fontFamily: {
        atkinson: ['"Atkinson Hyperlegible"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};

export default config;
