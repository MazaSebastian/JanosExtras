import styles from '@/styles/Loading.module.css';

export default function Loading({ 
  message = 'Cargando...', 
  size = 'medium',
  fullScreen = false,
  inline = false,
  variant = 'primary' // primary, success, gradient
}) {
  const sizeClass = styles[size] || styles.medium;
  const containerClass = fullScreen 
    ? styles.fullScreen 
    : inline 
    ? styles.inline 
    : styles.container;

  const variantClass = variant && styles[variant] ? styles[variant] : '';
  
  return (
    <div className={containerClass}>
      <div className={`${styles.spinnerContainer} ${variantClass}`}>
        <div className={`${styles.spinner} ${sizeClass}`}>
          <div className={styles.spinnerRing}></div>
          <div className={styles.spinnerRing}></div>
          <div className={styles.spinnerRing}></div>
        </div>
        {variant === 'gradient' && (
          <div className={styles.gradientOverlay}></div>
        )}
      </div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}

// Componente para botones con loading
export function LoadingButton({ 
  loading, 
  children, 
  className = '', 
  disabled,
  ...props 
}) {
  return (
    <button 
      className={`${styles.button} ${loading ? styles.buttonLoading : ''} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <span className={styles.buttonSpinner}></span>}
      <span className={loading ? styles.buttonTextHidden : ''}>{children}</span>
    </button>
  );
}

// Componente para skeleton loading (placeholder mientras carga)
export function Skeleton({ width, height, rounded = false, className = '', animated = true }) {
  return (
    <div 
      className={`${styles.skeleton} ${rounded ? styles.skeletonRounded : ''} ${animated ? styles.skeletonAnimated : ''} ${className}`}
      style={{ width, height }}
    ></div>
  );
}

// Componente para skeleton de tarjetas
export function SkeletonCard({ count = 3, columns = null }) {
  const gridStyle = columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : {};
  return (
    <div className={styles.skeletonGrid} style={gridStyle}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <Skeleton height="20px" width="60%" rounded />
          <Skeleton height="16px" width="100%" className={styles.skeletonMargin} />
          <Skeleton height="16px" width="80%" />
        </div>
      ))}
    </div>
  );
}

// Componente para loading overlay (sobre contenido existente)
export function LoadingOverlay({ message = 'Cargando...', children }) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      <div className={styles.overlay}>
        <Loading message={message} size="small" />
      </div>
    </div>
  );
}

// Componente para loading de tabla
export function TableLoading({ rows = 5, columns = 4 }) {
  return (
    <div className={styles.tableLoading}>
      <div className={styles.tableHeader}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="20px" width="100px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={styles.tableRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="16px" width="80%" />
          ))}
        </div>
      ))}
    </div>
  );
}

