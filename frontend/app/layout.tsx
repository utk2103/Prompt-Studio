import type { Metadata } from 'next';
import { JetBrains_Mono, Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jetbrains',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Prompt Studio — The Lean Prompt Engineering Workbench',
  description: 'Analyze, score, optimize, and store prompts. FastAPI + Next.js. Lean persona layer ships across every major agent host.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${inter.variable} ${instrumentSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
