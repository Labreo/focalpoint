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
        canvas: '#0c0d10',
        card: 'rgba(21, 22, 27, 0.88)',
        bg: '#0c0d10',
        'bg-1': '#15161b',
        'bg-2': '#212228',
        'bg-3': '#32333d',
        fg: '#f4f4f5',
        muted: '#a1a1aa',
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
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-snapped': 'spin 4s steps(24) infinite',
        'flicker-in': 'flicker-in .35s steps(1) 1',
        'grid-scroll': 'grid-scroll 16s linear infinite',
      }
    },
  },
  plugins: [],
};

export default config;
