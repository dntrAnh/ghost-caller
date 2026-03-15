import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Let Me Know — AI Travel Planner',
  description: 'Plan the day. Book the table. Skip the group chat.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="bg-[#F6F8FA] text-[#0F1117] min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
