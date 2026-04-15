import { format, formatDistanceToNow, isThisMonth, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Formateo de fechas
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '-';
  try {
    return format(new Date(date), formatStr, { locale: es });
  } catch {
    return '-';
  }
};

export const formatDateTime = (date) => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

export const formatTimeAgo = (date) => {
  if (!date) return '-';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
  } catch {
    return '-';
  }
};

// Formateo de moneda
export const formatCurrency = (amount, currency = 'PEN') => {
  if (amount === null || amount === undefined) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';

  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(num);
};

// Formateo de números
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('es-PE').format(num);
};

// Truncar texto
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Capitalizar primera letra
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Parsear fecha sin desfase de zona horaria
const parseDateSafe = (dateString) => {
  if (!dateString) return null;
  // Si es string YYYY-MM-DD, agregar hora mediodía para evitar desfase de timezone
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString + 'T12:00:00');
  }
  return new Date(dateString);
};

// Verificar si una suscripción está por vencer (7 días o menos)
export const isExpiringSoon = (expirationDate, daysThreshold = 7) => {
  if (!expirationDate) return false;
  const expDate = parseDateSafe(expirationDate);
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Mediodía para consistencia
  const days = differenceInDays(expDate, today);
  return days <= daysThreshold && days > 0;
};

// Verificar si una fecha es de este mes
export const isCurrentMonth = (date) => {
  if (!date) return false;
  return isThisMonth(new Date(date));
};

// Obtener iniciales de un nombre
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Generar color basado en string (para avatares)
export const stringToColor = (string) => {
  if (!string) return '#757575';
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

// Validar email
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validar teléfono peruano
export const isValidPhone = (phone) => {
  const regex = /^(\+51)?[0-9]{9}$/;
  return regex.test(phone?.replace(/\s/g, ''));
};

// Formatear teléfono
export const formatPhone = (phone) => {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('51')) {
    return `+51 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
};

// Debounce function
export const debounce = (func, wait = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// Construir URL de imagen
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4002';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Descargar archivo
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Copiar al clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// Obtener parámetros de URL
export const getQueryParams = (search) => {
  return Object.fromEntries(new URLSearchParams(search));
};

// Construir query string
export const buildQueryString = (params) => {
  const filtered = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => [key, String(value)]);
  return new URLSearchParams(filtered).toString();
};
