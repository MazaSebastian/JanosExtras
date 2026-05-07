import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { clearAuth } from '@/utils/auth';
import { salonesAPI } from '@/services/api';
import styles from '@/styles/DJLayout.module.css';

export default function DJLayout({ user, children }) {
  const router = useRouter();
  const currentPath = router.pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const [salonNombre, setSalonNombre] = useState('');

  useEffect(() => {
    if (user?.salon_id) {
      salonesAPI.getById(user.salon_id)
        .then(res => {
          if (res.data?.nombre) setSalonNombre(res.data.nombre);
        })
        .catch(err => console.warn('Error cargando salón'));
    }
  }, [user]);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const menuItems = [
    { path: '/dashboard/home', label: 'Home', icon: '🏠', pageTitle: 'Home' },
    { path: '/dashboard', label: 'Eventos y Extras', icon: '📊', pageTitle: 'Eventos y Extras' },
    { path: '/dashboard/fichadas', label: 'Fichadas', icon: '⏱️', pageTitle: 'Fichadas' },
    { path: '/dashboard/software', label: 'Software', icon: '💻', pageTitle: 'Software' },
    { path: '/dashboard/shows', label: 'Shows', icon: '🎤', pageTitle: 'Shows' },
    { path: '/dashboard/contenido', label: 'Contenido', icon: '📦', pageTitle: 'Contenido' },
    { path: '/dashboard/coordinaciones', label: 'Coordinaciones', icon: '📋', pageTitle: 'Coordinaciones' },
    { path: '/dashboard/fechas-libres', label: 'Fechas Libres', icon: '📅', pageTitle: 'Fechas Libres' },
    { path: '/dashboard/check-in-tecnico', label: 'Check-In Técnico', icon: '🔧', pageTitle: 'Check-In Técnico' },
    { path: null, label: 'Adicionales de Técnica', icon: '⚡', inDevelopment: true },
  ];

  // Obtener el título de la página actual
  const currentMenuItem = menuItems.find(item => item.path === currentPath);
  const pageTitle = currentMenuItem?.pageTitle || 'Dashboard';

  const handleMenuClick = (path) => {
    router.push(path);
    setMenuOpen(false); // Cerrar menú al hacer clic en un item
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest(`.${styles.sidebar}`) && !event.target.closest(`.${styles.hamburgerButton}`)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevenir scroll del body cuando el menú está abierto
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <Head>
        <title>Jano's DJ's - {pageTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={styles.layout}>
        <button
          className={`${styles.hamburgerButton} ${menuOpen ? styles.hamburgerButtonOpen : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={styles.hamburgerIcon}>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </span>
        </button>
        <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.brand}>
            <h2 className={styles.brandTitle}>Sistema DJs</h2>
            <p className={styles.brandSubtitle}>{user?.nombre || 'DJ'}</p>
            {salonNombre && (
              <div className={styles.salonBadge}>
                <span className={styles.salonIcon}>📍</span>
                {salonNombre}
              </div>
            )}
          </div>
          <nav className={styles.menu}>
            {menuItems.map((item) => (
              <button
                key={item.path || item.label}
                className={`${styles.menuItem} ${currentPath === item.path ? styles.menuItemActive : ''
                  } ${item.inDevelopment ? styles.menuItemInDevelopment : ''}`}
                onClick={() => !item.inDevelopment && handleMenuClick(item.path)}
                disabled={item.inDevelopment}
                title={item.inDevelopment ? 'En desarrollo' : ''}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span className={styles.menuLabel}>{item.label}</span>
                {item.inDevelopment && (
                  <span className={styles.developmentBadge}>Próximamente</span>
                )}
              </button>
            ))}
          </nav>
          <div className={styles.sidebarFooter}>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Cerrar Sesión
            </button>
          </div>
        </aside>
        {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} />}
        <main className={styles.content}>
          <div key={router.pathname} className={styles.pageTransition}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

