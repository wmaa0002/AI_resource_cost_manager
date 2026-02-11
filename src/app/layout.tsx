import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 成本追踪器",
  description: "管理和分析你的 AI 模型成本",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
