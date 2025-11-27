import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth } from '@/utils/auth';
import DJLayout from '@/components/DJLayout';
import CheckInTecnicoPanel from '@/components/CheckInTecnicoPanel';
import Loading from '@/components/Loading';

export default function CheckInTecnicoPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authUser = getAuth();
    if (!authUser) {
      router.push('/login');
      return;
    }
    setUser(authUser);
    setLoading(false);
  }, [router]);

  if (loading) {
    return <Loading message="Cargando..." />;
  }

  return (
    <DJLayout user={user}>
      <CheckInTecnicoPanel />
    </DJLayout>
  );
}

