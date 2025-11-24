import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth } from '@/utils/auth';
import DJLayout from '@/components/DJLayout';
import ContenidoPanel from '@/components/ContenidoPanel';
import styles from '@/styles/DashboardPage.module.css';

export default function ContenidoPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.token || !auth.user) {
      router.push('/login');
      return;
    }

    if (auth.user.rol === 'admin') {
      router.push('/admin');
      return;
    }

    setUser(auth.user);
  }, [router]);

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <DJLayout user={user}>
      <div className={styles.container}>
        <ContenidoPanel />
      </div>
    </DJLayout>
  );
}

