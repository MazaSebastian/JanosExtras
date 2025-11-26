// Redirigir a la página de pre-coordinación
// Esta ruta corta (/pre/[token]) redirige a la ruta completa para mantener compatibilidad
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Loading from '@/components/Loading';

export default function PreCoordinacionShortPage() {
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (token) {
      // Redirigir a la ruta completa
      router.replace(`/pre-coordinacion/${token}`);
    }
  }, [token, router]);

  return <Loading message="Cargando pre-coordinación..." fullScreen />;
}

