import type { Metadata } from 'next';
import { JetBrains_Mono, Manrope } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jetbrains',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'Prompt Studio · The Lean Prompt Engineering Workbench',
  description: 'Analyze, score, optimize, and store prompts. FastAPI + Next.js. Lean persona layer ships across every major agent host. Available on PyPI as promptstudio-ai.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${manrope.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
