import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth } from '@/utils/auth';
import FichadasPanel from '@/components/FichadasPanel';
import DJLayout from '@/components/DJLayout';
import styles from '@/styles/DashboardPage.module.css';

export default function FichadasPage() {
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
        <FichadasPanel />
      </div>
    </DJLayout>
  );
}

