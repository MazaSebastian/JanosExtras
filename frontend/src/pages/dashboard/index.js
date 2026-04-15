import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getAuth } from '@/utils/auth';
import { salonesAPI, eventosAPI } from '@/services/api';
import Loading from '@/components/Loading';
import SalonSelector from '@/components/SalonSelector';
import Calendar from '@/components/Calendar';
import EventMarker from '@/components/EventMarker';
import EventActionModal from '@/components/EventActionModal';
import Dashboard from '@/components/Dashboard';
import DJLayout from '@/components/DJLayout';
import styles from '@/styles/DashboardPage.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const isMounted = useRef(true);
  const refreshTimerRef = useRef(null);

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
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Mount-only initialization ──
  // CRITICAL: dependency is [] (empty) — NOT [router].
  // Using [router] caused the effect to re-fire during route transitions,
  // triggering state updates that blocked Next.js from unmounting this page.
  useEffect(() => {
    isMounted.current = true; // React 18 StrictMode safe-reset
    const auth = getAuth();
    if (!auth.token || !auth.user) {
      router.replace('/login');
      return;
    }

    if (auth.user.rol === 'admin') {
      router.replace('/admin');
      return;
    }

    setUser(auth.user);

    // Fetch unread assignments (guarded)
    eventosAPI.getUnreadAssignments()
      .then(res => { if (isMounted.current) setUnreadCount(res.data.unread || 0); })
      .catch(err => console.error('Error fetching unread:', err));

    if (auth.user.salon_id) {
      setSelectedSalon(auth.user.salon_id);
    }

    // Cleanup: mark component as unmounted so no async callback touches state
    return () => {
      isMounted.current = false;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkSeen = async () => {
    try {
      await eventosAPI.markAssignmentsSeen();
      if (isMounted.current) setUnreadCount(0);
      document.querySelector(`.${styles.calendarSection}`)?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Error marcando leídos:', err);
    }
  };

  // Reactive effect to keep top-right Dashboard Header in sync automatically
  useEffect(() => {
    if (!selectedSalon) {
      if (isMounted.current) setUserSalonInfo(null);
      return;
    }
    setLoadingSalonInfo(true);
    salonesAPI.getById(selectedSalon)
      .then(res => { if (isMounted.current) setUserSalonInfo(res.data); })
      .catch(err => console.error('Error al cargar información del salón dinámico:', err))
      .finally(() => { if (isMounted.current) setLoadingSalonInfo(false); });
  }, [selectedSalon]);

  const triggerRefreshSequence = useCallback(() => {
    if (!isMounted.current) return;

    setRefreshKey((prev) => prev + 1);
    setDashboardRefreshKey((prev) => prev + 1);

    if (dashboardRefreshFn) {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        if (isMounted.current && dashboardRefreshFn) {
          dashboardRefreshFn();
        }
      }, 300);
    }
  }, [dashboardRefreshFn]);

  const handleDateClick = (date) => {
    if (!selectedSalon) {
      alert('Por favor, selecciona un salón primero');
      return;
    }
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

  if (!user) {
    return <Loading message="Cargando..." fullScreen />;
  }

  return (
    <DJLayout user={user}>
      <div className={styles.container}>
        {unreadCount > 0 && (
          <div
            className={styles.unreadBanner}
            onClick={handleMarkSeen}
            role="button"
            tabIndex={0}
          >
            <span className={styles.bannerIcon}>🔔</span>
            <span className={styles.bannerText}>
              Gerencia te ha asignado {unreadCount === 1 ? 'un nuevo evento' : 'nuevos eventos'}. Click aca para ver.
            </span>
          </div>
        )}
        <Dashboard
          refreshTrigger={dashboardRefreshKey}
          onRefresh={(fn) => setDashboardRefreshFn(() => fn)}
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
        <EventActionModal
          event={eventToDelete}
          onRefresh={triggerRefreshSequence}
          onClose={() => setEventToDelete(null)}
        />
      )}
    </DJLayout>
  );
}
