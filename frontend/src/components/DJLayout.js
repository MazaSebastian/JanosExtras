import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { clearAuth } from '@/utils/auth';
import styles from '@/styles/DJLayout.module.css';

export default function DJLayout({ user, children }) {
  const router = useRouter();
  const currentPath = router.pathname;
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const menuItems = [
    { path: '/dashboard/home', label: 'Home', icon: '🏠' },
    { path: '/dashboard', label: 'Eventos y Extras', icon: '📊' },
    { path: '/dashboard/fichadas', label: 'Fichadas', icon: '⏱️' },
    { path: '/dashboard/software', label: 'Software', icon: '💻' },
    { path: '/dashboard/shows', label: 'Shows', icon: '🎤' },
    { path: '/dashboard/contenido', label: 'Contenido', icon: '📦' },
    { path: '/dashboard/coordinaciones', label: 'Coordinaciones', icon: '📋' },
    { path: '/dashboard/adicionales-tecnica', label: 'Adicionales Técnica', icon: '⚡' },
  ];

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
    <div className={styles.layout}>
      <button
        className={styles.hamburgerButton}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span className={styles.hamburgerIcon}>☰</span>
      </button>
      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <h2 className={styles.brandTitle}>Sistema DJs</h2>
          <p className={styles.brandSubtitle}>{user?.nombre || 'DJ'}</p>
        </div>
        <nav className={styles.menu}>
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`${styles.menuItem} ${
                currentPath === item.path ? styles.menuItemActive : ''
              }`}
              onClick={() => handleMenuClick(item.path)}
            >
              <span className={styles.menuIcon}>{item.icon}</span>
              <span className={styles.menuLabel}>{item.label}</span>
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
      <main className={styles.content}>{children}</main>
    </div>
  );
}

