import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DJLayout from '@/components/DJLayout';
import CoordinacionFlujo from '@/components/CoordinacionFlujo';
import styles from '@/styles/CoordinacionFlujo.module.css';

export default function IniciarCoordinacionPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <DJLayout>
        <div className={styles.loadingContainer}>
          <p>Cargando coordinación...</p>
        </div>
      </DJLayout>
    );
  }

  if (!id) {
    return (
      <DJLayout>
        <div className={styles.errorContainer}>
          <p>ID de coordinación no válido</p>
        </div>
      </DJLayout>
    );
  }

  return (
    <DJLayout>
      <div className={styles.container}>
        {error && (
          <div className={styles.error}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        <CoordinacionFlujo coordinacionId={parseInt(id, 10)} />
      </div>
    </DJLayout>
  );
}

