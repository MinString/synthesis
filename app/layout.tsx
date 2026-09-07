import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'高校合成',description:'点击生成大学校徽球，同校相遇合成，共十一档。'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="zh-CN"><body>{children}</body></html>}
