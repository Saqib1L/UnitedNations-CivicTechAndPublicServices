import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estate Unlock — A clear path forward",
  description:
    "A shared workspace for families, lawyers and estate processing. Interactive proof of concept.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
