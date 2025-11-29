import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./css/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sinbin | 고속 팀을 위한 가드레일",
    template: "%s | Sinbin",
  },
  description:
    "Sinbin은 플레이북, 가드레일, 실시간 컨텍스트를 한곳에 모아 프론트라인 팀이 신뢰를 해치지 않고 더 빠르게 일할 수 있게 돕습니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
