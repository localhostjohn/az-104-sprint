import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Azura | Enterprise Cloud Operations',
  description: 'A unified Azure operations workspace for applications, deployments, governance, and integrations.',
  openGraph: {
    title: 'Azura — Enterprise Cloud Operations',
    description: 'One workspace for Azure applications, deployments and governance.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Azura — Enterprise Cloud Operations',
    description: 'One workspace for Azure applications, deployments and governance.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
