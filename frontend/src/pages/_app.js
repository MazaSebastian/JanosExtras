import '../../sentry.client.config';
import '../../sentry.server.config';
import '@/styles/globals.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* Favicon básico */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        
        {/* Apple Touch Icon (iOS) */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        {/* Android Chrome Icons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />
        
        {/* Manifest para PWA */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Meta tags adicionales */}
        <meta name="theme-color" content="#772c87" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Jano's DJ's" />
        
        {/* Título por defecto */}
        <title>Jano's DJ's</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

