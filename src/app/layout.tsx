import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthMarker from "@/components/AuthMarker";

export const metadata: Metadata = {
  title: "Suhana Education — JKBOSE Class 8–10",
  description:
    "Live classes, recorded lectures, study material and fortnightly exams for J&K State Board (JKBOSE) Classes 8, 9 and 10.",
  icons: { icon: "/suhana-icon.png", apple: "/suhana-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1226" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/schibsted-grotesk-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('suhana-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}try{var u=localStorage.getItem('suhana.user.v1');if(u){var j=JSON.parse(u);if(j&&j.full_name)document.documentElement.setAttribute('data-authed','yes');}}catch(e){}",
          }}
        />
      </head>
      <body>
        <AuthMarker />
        <Navbar />
        <main id="main">{children}</main>
        <Footer />
        <div id="toast" role="status" aria-live="polite" />
      </body>
    </html>
  );
}
