import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth } from '@/utils/auth';
import { salonesAPI } from '@/services/api';
import Loading from '@/components/Loading';
import SalonSelector from '@/components/SalonSelector';
import Calendar from '@/components/Calendar';
import EventMarker from '@/components/EventMarker';
import EventDeleteModal from '@/components/EventDeleteModal';
import Dashboard from '@/components/Dashboard';
import DJLayout from '@/components/DJLayout';
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
    // Preservar la posición del scroll antes de actualizar
    const scrollPosition = window.scrollY;
    const scrollContainer = document.querySelector(`.${styles.container}`);
    const containerScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;

    // Actualizar triggers sin re-montar completamente
    setRefreshKey((prev) => prev + 1);
    setDashboardRefreshKey((prev) => prev + 1);

    // Usar requestAnimationFrame para restaurar el scroll después de que el DOM se actualice
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Restaurar scroll de la ventana
        if (scrollPosition > 0) {
          window.scrollTo(0, scrollPosition);
        }
        
        // Restaurar scroll del contenedor si existe
        if (scrollContainer && containerScrollTop > 0) {
          scrollContainer.scrollTop = containerScrollTop;
        }
      });
    });

    // Actualizar Dashboard de forma controlada
    if (dashboardRefreshFn) {
      setTimeout(() => {
        const beforeScroll = window.scrollY;
        dashboardRefreshFn();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, beforeScroll);
          });
        });
      }, 300);
    }
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

  if (!user) {
    return <Loading message="Cargando..." fullScreen />;
  }

  return (
    <DJLayout user={user}>
      <div className={styles.container}>
        <Dashboard 
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
              refreshTrigger={refreshKey}
              salonId={selectedSalon}
              onDateClick={handleDateClick}
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
    </DJLayout>
  );
}

