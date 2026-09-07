import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'球球合成 · MERGE / 11',description:'点击生成圆球，同档相遇合成，共十一档大小。'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="zh-CN"><body>{children}</body></html>}
