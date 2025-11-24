import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth } from '@/utils/auth';
import DJLayout from '@/components/DJLayout';
import AdicionalesTecnicaPanel from '@/components/AdicionalesTecnicaPanel';

export default function AdicionalesTecnicaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.token || !auth.user) {
      router.push('/login');
      return;
    }
    setUser(auth.user);
  }, [router]);

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <DJLayout user={user}>
      <AdicionalesTecnicaPanel />
    </DJLayout>
  );
}

