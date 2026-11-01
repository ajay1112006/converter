import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Excel to PowerPoint (PPTX) Converter — Executive Data-Fidelity Engine",
  description:
    "Convert Excel workbooks into executive presentation decks with 100% numerical fidelity, native editable PowerPoint charts, and smart table pagination.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col selection:bg-indigo-500 selection:text-white bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
