import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MemorizaCloud - AWS Certification Prep",
  description: "Treinamento diário focado em memorização e erros para certificações AWS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen`}>
        <main className="max-w-md mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
