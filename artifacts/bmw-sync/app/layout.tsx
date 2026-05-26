import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BMW-Sync | Toilet Hygiene Compliance",
  description:
    "Malaysian restaurant BMW (Bersih, Menawan, Wangi) toilet hygiene mandate compliance system.",
  verification: {
    google: "dd3KUCT3Lo4j8F9d6t_0WP9khJJDOOXopLwOeV0YO2g",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
