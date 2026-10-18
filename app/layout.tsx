import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "FarmStreet — Your harvest. Your market.",
  description:
    "A seven-day Canadian agricultural market simulator. Trade your harvest, navigate changing markets, and learn what drives your selling margin. All market data is simulated.",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="theme-exchange">
      <body>{children}</body>
    </html>
  );
}
