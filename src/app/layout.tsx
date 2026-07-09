import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/layout/Providers';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'UPSC via PYQs — Learn the exam by dissecting every Previous Year Question',
  description: 'Prelims autopsies, Mains & Optional model answers, syllabus frameworks, and timed practice — attempt-first, free, with your progress saved on your device.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/vendor/katex/katex.min.css" />
        <script src="/vendor/katex/katex.min.js" defer></script>
      </head>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Providers>
          <Navbar />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
