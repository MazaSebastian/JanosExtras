import styles from '@/styles/PreCoordinacion.module.css';

export default function GraciasPage() {
  return (
    <div className={styles.container}>
      <div className={styles.confirmacionContainer}>
        <h1>✅ ¡Gracias!</h1>
        <p>
          Tu información ha sido recibida correctamente. El DJ se pondrá en contacto contigo 
          próximamente para coordinar los detalles finales de tu evento.
        </p>
        <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
          Puedes cerrar esta ventana.
        </p>
      </div>
    </div>
  );
}

