import { SSE_URL, STORAGE_KEYS } from '../utils/constants';

let eventSource = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000;
const eventListeners = new Map();

export const connectSocket = async () => {
  if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
    return eventSource;
  }

  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (!token) {
    console.warn('[SSE] No hay token, no se puede conectar');
    return null;
  }

  try {
    eventSource = new EventSource(`${SSE_URL}?token=${token}`);

    eventSource.onopen = () => {
      console.log('[SSE] Conectado');
      reconnectAttempts = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const eventType = data.type || data.event || 'message';

        const callbacks = eventListeners.get(eventType);
        if (callbacks) {
          callbacks.forEach(cb => cb(data));
        }

        const messageCallbacks = eventListeners.get('message');
        if (messageCallbacks) {
          messageCallbacks.forEach(cb => cb(data));
        }
      } catch (e) {
        // Ignorar mensajes que no son JSON (keepalive)
      }
    };

    eventSource.onerror = () => {
      console.log('[SSE] Error de conexion');
      eventSource.close();
      eventSource = null;

      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`[SSE] Reconectando (intento ${reconnectAttempts})...`);
        reconnectTimer = setTimeout(() => connectSocket(), RECONNECT_DELAY);
      }
    };

    return eventSource;
  } catch (error) {
    console.error('[SSE] Error al conectar:', error);
    return null;
  }
};

export const subscribeToEvent = (event, callback) => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event).add(callback);
};

export const unsubscribeFromEvent = (event, callback) => {
  if (callback) {
    eventListeners.get(event)?.delete(callback);
  } else {
    eventListeners.delete(event);
  }
};
