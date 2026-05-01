import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bike Booking Admin",
  description: "จัดการคิวร้านมอเตอร์ไซค์"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={inter.className}>
        {children}
        <Toaster richColors theme="dark" position="top-center" />
      </body>
    </html>
  );
}
