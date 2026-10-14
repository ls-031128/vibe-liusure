import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '宠物健康平台 MVP',
  description: 'AI 驱动的宠物健康管理平台：记录日常观察，回顾健康趋势，获取护理建议；不替代兽医诊断。',
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
