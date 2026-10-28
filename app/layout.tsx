import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Menü | LOBBY PREMIUM LOUNGE',description:'LOBBY PREMIUM LOUNGE güncel dijital menüsü.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr"><body>{children}</body></html>;}
