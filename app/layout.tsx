import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo, Source_Serif_4 } from "next/font/google";
import SiteBackground from "./components/SiteBackground";
import SiteNavBar from "./components/SiteNavBar";
import SiteFooter from "./components/SiteFooter";
import SiteScrollConfig from "./components/SiteScrollConfig";
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
  metadataBase: new URL("https://shtooky.com"),
  title: "Mark Woloschuk — Creative Director & Producer",
  description:
    "Mark Woloschuk — Creative Director & Producer in San Francisco. I ask the whos and whats before the hows.",
  openGraph: {
    title: "Mark Woloschuk — Creative Director & Producer",
    description:
      "I believe any story can be interesting if it’s told in the right way, and to the right audience.",
    url: "https://shtooky.com",
    type: "website",
  },
  twitter: { card: "summary" },
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
        <SiteBackground />
        <SiteNavBar />
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
        <SiteScrollConfig />
        <SiteFooter />
      </body>
    </html>
  );
}
