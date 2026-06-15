import axios from 'axios';
import { getAuth } from './auth';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function suscribirNotificacionesPush() {
  if (typeof window === 'undefined') return null;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('El navegador no soporta notificaciones Push.');
    return null;
  }

  try {
    const auth = getAuth();
    if (!auth.token) {
      console.warn('No hay token de sesión para registrar notificaciones Push.');
      return null;
    }

    // 1. Solicitar permisos de notificación
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') {
      console.warn('Permiso para notificaciones denegado.');
      return null;
    }

    // 2. Registrar el Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    
    // Esperar a que el service worker esté listo
    await navigator.serviceWorker.ready;

    // 3. Obtener suscripción actual o crear una nueva
    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicVapidKey) {
      console.error('Clave VAPID pública no configurada.');
      return null;
    }

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    }

    // 4. Enviar la suscripción al backend
    await axios.post('/api/auth/save-push-subscription', {
      subscription,
      dispositivo: navigator.userAgent
    }, {
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    });

    console.log('Notificaciones Push configuradas y suscritas con éxito.');
    return subscription;
  } catch (error) {
    console.error('Error al suscribirse a las notificaciones Push:', error);
    return null;
  }
}
