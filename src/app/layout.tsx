import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import BottomNavBar from "@/components/bottom-nav-bar";
import { ThemeProvider } from "@/components/theme-provider";

import { Anuphan } from "next/font/google";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["latin"],
});

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: {
    default: "EcoLivery - ระบบเช่าล็อกเกอร์อัจฉริยะ",
    template: "%s | EcoLivery",
  },
  description: "บริการเช่าล็อกเกอร์อัจฉริยะ สะดวก ปลอดภัย รองรับการจัดส่งสินค้า พร้อมระบบจัดการที่ทันสมัย",
  keywords: ["locker", "smart locker", "delivery", "package", "rental", "ล็อกเกอร์", "เช่าล็อกเกอร์", "จัดส่งสินค้า"],
  authors: [{ name: "EcoLivery Team" }],
  creator: "EcoLivery",
  publisher: "EcoLivery",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  openGraph: {
    title: "EcoLivery - ระบบเช่าล็อกเกอร์อัจฉริยะ",
    description: "บริการเช่าล็อกเกอร์อัจฉริยะ สะดวก ปลอดภัย รองรับการจัดส่งสินค้า",
    type: "website",
    locale: "th_TH",
    siteName: "EcoLivery",
  },
  twitter: {
    card: "summary_large_image",
    title: "EcoLivery - ระบบเช่าล็อกเกอร์อัจฉริยะ",
    description: "บริการเช่าล็อกเกอร์อัจฉริยะ สะดวก ปลอดภัย รองรับการจัดส่งสินค้า",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body
      className={`${anuphan.variable} antialiased`}
      >
        <div className="min-h-screen">
          <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
            <Navbar />
            {children}
            <Footer />
            <BottomNavBar />
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
