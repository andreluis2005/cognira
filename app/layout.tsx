<<<<<<< HEAD
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
=======
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cognira - AWS Certification Prep",
  description: "Treinamento diário focado em memorização e erros para certificações AWS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-slate-50`}>
        {children}
      </body>
    </html>
  );
}
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
