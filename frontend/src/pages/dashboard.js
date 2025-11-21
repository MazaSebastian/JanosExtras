import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, clearAuth } from '@/utils/auth';
import { salonesAPI } from '@/services/api';
import SalonSelector from '@/components/SalonSelector';
import Calendar from '@/components/Calendar';
import EventMarker from '@/components/EventMarker';
import EventDeleteModal from '@/components/EventDeleteModal';
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
  const [eventToDelete, setEventToDelete] = useState(null);
  const [userSalonInfo, setUserSalonInfo] = useState(null);
  const [loadingSalonInfo, setLoadingSalonInfo] = useState(false);

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
    if (auth.user.salon_id) {
      setSelectedSalon(auth.user.salon_id);
      fetchUserSalon(auth.user.salon_id);
    }
  }, [router]);

  const fetchUserSalon = async (salonId) => {
    if (!salonId) return;
    try {
      setLoadingSalonInfo(true);
      const response = await salonesAPI.getById(salonId);
      setUserSalonInfo(response.data);
    } catch (error) {
      console.error('Error al cargar información del salón:', error);
    } finally {
      setLoadingSalonInfo(false);
    }
  };

  const triggerRefreshSequence = () => {
    setRefreshKey((prev) => prev + 1);
    setDashboardRefreshKey((prev) => prev + 1);

    if (dashboardRefreshFn) {
      setTimeout(() => {
        dashboardRefreshFn();
      }, 300);
    }

    setTimeout(() => {
      setDashboardRefreshKey((prev) => prev + 1);
    }, 600);
  };

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
    triggerRefreshSequence();
  };

  const handleExistingEventClick = (event) => {
    setEventToDelete(event);
  };

  const handleEventDeleted = () => {
    triggerRefreshSequence();
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
            salonInfo={userSalonInfo}
            salonLoading={loadingSalonInfo}
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
                currentUserId={user?.id}
                onExistingEventClick={handleExistingEventClick}
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

      {eventToDelete && (
        <EventDeleteModal
          event={eventToDelete}
          onEventDeleted={handleEventDeleted}
          onClose={() => setEventToDelete(null)}
        />
      )}
    </div>
  );
}

