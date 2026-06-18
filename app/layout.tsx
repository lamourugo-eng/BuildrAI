import type { Metadata } from 'next';
import { Instrument_Serif, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import { resolveServerAppOrigin } from '@/lib/auth/app-origin';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: '400',
  style: ['normal', 'italic'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-tech',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(resolveServerAppOrigin()),
  title: 'BuildrAI. Coaching IA pour entrepreneurs',
  description:
    'BuildrAI. Ton coach IA pour lancer et faire grandir ton entreprise. Disponible 24h/24.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${plusJakarta.variable} ${instrumentSerif.variable} ${spaceGrotesk.variable}`}>
        <div className="site-ambient" aria-hidden="true">
          <span className="site-orb site-orb--1" />
          <span className="site-orb site-orb--2" />
          <span className="site-orb site-orb--3" />
        </div>
        <div className="noise" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
