import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthMarker from "@/components/AuthMarker";

export const metadata: Metadata = {
  title: "Suhana Education — JKBOSE Class 8–10",
  description:
    "Live classes, recorded lectures and test series for J&K State Board (JKBOSE), Classes 8–10.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
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
        <main>{children}</main>
        <Footer />
        <div id="toast" role="status" aria-live="polite" />
      </body>
    </html>
  );
}
