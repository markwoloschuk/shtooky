import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo, Source_Serif_4 } from "next/font/google";
import Background from "./components/Background";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import ScrollConfig from "./components/ScrollConfig";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "shtooky",
  description: "Mark Woloschuk — Creative Lead & Designer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${sourceSerif4.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Background />
        <NavBar />
        <ScrollConfig />
<div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>        <Footer />
      </body>
    </html>
  );
}
