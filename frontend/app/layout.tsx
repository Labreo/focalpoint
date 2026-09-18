import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'FocalPoint: Gaze-Driven Semantic Media Adaptation System',
  description: 'Content-aware, intent-driven broadcast reconstruction for individuals with Age-Related Macular Degeneration, Retinitis Pigmentosa, and Low Visual Acuity.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#050811',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-canvas text-amber-highlight">
      <body className="min-h-screen bg-canvas antialiased selection:bg-amber-highlight selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
