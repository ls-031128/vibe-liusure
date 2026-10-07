import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '宠物健康平台 MVP',
  description: '宠物健康信息辅助工具开发阶段首页',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
