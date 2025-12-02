import '../../sentry.client.config';
import '../../sentry.server.config';
import '@/styles/globals.css';
import Head from 'next/head';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  // Registrar Service Worker para PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration.scope);
        })
        .catch((error) => {
          console.error('Error al registrar Service Worker:', error);
        });
    }
  }, []);

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
        
        {/* Meta tags adicionales para PWA */}
        <meta name="theme-color" content="#772c87" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* iOS específico */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Jano's DJ's" />
        
        {/* Android específico */}
        <meta name="application-name" content="Jano's DJ's" />
        <meta name="msapplication-TileColor" content="#772c87" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Viewport optimizado para móvil */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        
        {/* Título por defecto */}
        <title>Jano's DJ's</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

