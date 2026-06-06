import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import AuthModal from "@/components/AuthModal";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elite Meds - Modern Pharmacy & Healthcare",
  description: "Get premium and authenticated medicines delivered directly to your doorstep. Schedule professional doctor consultations online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <CartDrawer />
            <AuthModal />
            
            {/* Global Footer */}
            <footer className="glass border-t border-[var(--card-border)] py-8 mt-12 transition-colors">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-[var(--text-secondary)]">
                <div>
                  <span className="font-bold text-teal-700 dark:text-teal-400">Elite Meds</span> © 2026. Made with ❤️ for wellness.
                </div>
                <div className="flex space-x-6">
                  <a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Terms of Service</a>
                  <a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Contact Support</a>
                </div>
              </div>
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
