import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
      colors: {
        g1: '#33ff66',
        g2: '#00cc44',
        g3: '#007722',
        gd: '#004411',
        yl: '#ffcc00',
        rd: '#ff4444',
        cy: '#00ccff',
        wh: '#e8ffe8',
        bg: '#080c08',
        bg2: '#0b100b',
        bd: '#003311',
      },
    },
  },
  plugins: [],
};

export default config;
