import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '5x5x5 Wellness Hub - Eat to Beat Disease',
  description: 'A health-focused platform based on William Li\'s 5x5x5 system for disease prevention through food',
  keywords: ['health', 'wellness', 'nutrition', '5x5x5', 'William Li', 'recipes', 'disease prevention'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}