import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Plan Your Perfect Day · Day-Out Profile Builder',
  description:
    'Build your personalized day-out profile and let our AI planner create the perfect itinerary for you.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 via-white to-violet-50/20 min-h-screen page-bg">
        {children}
      </body>
    </html>
  );
}
