import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, clearAuth } from '@/utils/auth';
import SalonSelector from '@/components/SalonSelector';
import Calendar from '@/components/Calendar';
import EventMarker from '@/components/EventMarker';
import Dashboard from '@/components/Dashboard';
import styles from '@/styles/DashboardPage.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventMarker, setShowEventMarker] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const [dashboardRefreshFn, setDashboardRefreshFn] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.token || !auth.user) {
      router.push('/login');
      return;
    }
    setUser(auth.user);
  }, [router]);

  const handleDateClick = (date) => {
    if (!selectedSalon) {
      alert('Por favor, selecciona un salón primero');
      return;
    }
    
    // Verificar si la fecha ya tiene un evento (esto se hace en el Calendar también, pero por seguridad)
    setSelectedDate(date);
    setShowEventMarker(true);
  };

  const handleEventCreated = () => {
    setShowEventMarker(false);
    setSelectedDate(null);
    
    // Forzar recarga del calendario
    setRefreshKey((prev) => prev + 1);
    
    // Forzar recarga del Dashboard inmediatamente y con delay
    setDashboardRefreshKey((prev) => prev + 1);
    
    // Si hay función de recarga directa, usarla también
    if (dashboardRefreshFn) {
      setTimeout(() => {
        dashboardRefreshFn();
      }, 300);
    }
    
    // Recarga adicional con delay para asegurar
    setTimeout(() => {
      setDashboardRefreshKey((prev) => prev + 1);
    }, 600);
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Sistema DJs</h1>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Hola, {user.nombre}</span>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <Dashboard 
            key={dashboardRefreshKey} 
            refreshTrigger={dashboardRefreshKey}
            onRefresh={setDashboardRefreshFn}
          />

          <div className={styles.calendarSection}>
            <SalonSelector
              selectedSalon={selectedSalon}
              onSalonChange={setSelectedSalon}
            />

            {selectedSalon ? (
              <Calendar
                key={refreshKey}
                salonId={selectedSalon}
                onDateClick={handleDateClick}
                currentUserSalonId={user?.salon_id}
              />
            ) : (
              <div className={styles.placeholder}>
                Selecciona un salón para ver el calendario
              </div>
            )}
          </div>
        </div>
      </main>

      {showEventMarker && selectedDate && (
        <EventMarker
          date={selectedDate}
          salonId={selectedSalon}
          onEventCreated={handleEventCreated}
          onClose={() => {
            setShowEventMarker(false);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
}

