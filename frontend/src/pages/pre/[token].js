// Redirigir a la página de pre-coordinación
// Esta ruta corta (/pre/[token]) redirige a la ruta completa para mantener compatibilidad
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Loading from '@/components/Loading';

export async function getServerSideProps(context) {
  const { token } = context.params;
  let metadata = null;

  try {
    // Dynamic import to avoid client-side bundling issues with pg/pool
    const pool = (await import('@/lib/database-config.js')).default;
    const query = `
      SELECT nombre_agasajado, tipo_evento
      FROM coordinaciones
      WHERE pre_coordinacion_token = $1
        AND activo = true
      LIMIT 1
    `;
    const result = await pool.query(query, [token]);
    if (result.rows.length > 0) {
      metadata = {
        nombre_agasajado: result.rows[0].nombre_agasajado || '',
        tipo_evento: result.rows[0].tipo_evento || ''
      };
    }
  } catch (error) {
    console.error('Error fetching coordination metadata in getServerSideProps:', error);
  }

  return {
    props: {
      token: token || null,
      metadata
    }
  };
}

export default function PreCoordinacionShortPage({ token, metadata }) {
  const router = useRouter();

  useEffect(() => {
    if (token) {
      // Redirigir a la ruta completa
      router.replace(`/pre-coordinacion/${token}`);
    }
  }, [token, router]);

  // Valores dinámicos si existe la metadata
  const title = metadata?.tipo_evento && metadata?.nombre_agasajado
    ? `Pre-coordinación ${metadata.tipo_evento} de ${metadata.nombre_agasajado}`
    : "Pre-coordinación - Jano's DJ's";

  const description = "¡Ingresá a este link para comenzar el recorrido guiado!";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content="https://janosdjs.com/logo-janos-blanco.png" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:image" content="https://janosdjs.com/logo-janos-blanco.png" />
      </Head>
      <Loading message="Cargando pre-coordinación..." fullScreen />
    </>
  );
}


