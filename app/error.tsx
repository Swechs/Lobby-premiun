'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="auth-page"><div className="auth-card"><span className="eyebrow">LOBBY PREMIUM LOUNGE</span><h1>Menü yüklenemedi.</h1><p>Lütfen birkaç saniye sonra yeniden deneyin.</p><button className="primary" onClick={reset}>Yeniden dene</button></div></main>;}
