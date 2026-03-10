import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SiteHeader from '@/components/SiteHeader';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Cognira',
    description: 'Approval-oriented learning platform with cognitive engine and question-based studying.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen bg-slate-950 text-slate-50`}>
                <SiteHeader />
                <main className="min-h-screen px-4 py-6 md:px-6">
                    {children}
                </main>
            </body>
        </html>
    );
}
