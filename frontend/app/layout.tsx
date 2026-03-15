import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ghost Caller — AI Travel Planner',
  description: 'Plan the day. Book the table. Skip the group chat.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F6F8FA] text-[#0F1117] min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
