// API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4002/api';

// SSE URL (misma base, endpoint /events)
export const SSE_URL = (() => {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4002/api';
  return `${base}/events`;
})();

// App Info
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Marketplace Admin';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// LocalStorage Keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
  THEME: 'app_theme',
};

// Estados de aprobacion (como los usa el backend)
export const APPROVAL_STATUS = {
  PENDING: 'PENDIENTE',
  APPROVED: 'APROBADO',
  REJECTED: 'RECHAZADO',
};

// Estados de suscripcion activa
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
};

// Estados de usuario
export const USER_STATUS = {
  ACTIVE: true,
  INACTIVE: false,
};

// Estados de ticket (el backend usa tickets, no complaints)
export const TICKET_STATUS = {
  OPEN: 'ABIERTO',
  ATTENDED: 'ATENDIDO',
  CLOSED: 'CERRADO',
};

// Tipos de usuario
export const USER_TYPES = {
  ADMIN: 'ADMINISTRADOR',
  SELLER: 'VENDEDOR',
  BUYER: 'COMPRADOR',
};

// Roles del backend
export const ROLES = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  VENDEDOR: 'VENDEDOR',
  COMPRADOR: 'COMPRADOR',
};

// Metodos de pago
export const PAYMENT_METHODS = {
  TRANSFER: 'transfer',
  CASH: 'cash',
  CRYPTO: 'crypto',
};

// Paginacion por defecto
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  PAGE_SIZE: 20,
};

// Periodos para reportes
export const REPORT_PERIODS = {
  WEEK: 'week',
  MONTH: 'month',
  ALL: 'all',
};

// Labels para estados
export const STATUS_LABELS = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  ABIERTO: 'Abierto',
  ATENDIDO: 'Atendido',
  CERRADO: 'Cerrado',
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  active: 'Activo',
  inactive: 'Inactivo',
};

// Labels para tipos de usuario
export const USER_TYPE_LABELS = {
  ADMINISTRADOR: 'Administrador',
  VENDEDOR: 'Vendedor',
  COMPRADOR: 'Comprador',
};

// Sidebar width
export const SIDEBAR_WIDTH = 280;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

// Breakpoints
export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

// Eventos SSE (deben coincidir EXACTO con backend/config/eventNames.js)
export const SSE_EVENTS = {
  ADMIN_PENDING_SELLER: 'admin.pending.seller',
  ADMIN_PENDING_STORE: 'admin.pending.store',
  ADMIN_PENDING_PRODUCT: 'admin.pending.product',
  ADMIN_PENDING_SUBSCRIPTION: 'admin.pending.subscription',
  TICKET_CREATED: 'ticket.created',
  TICKET_MESSAGE_CREATED: 'ticket.message.created',
  TICKET_STATUS_UPDATED: 'ticket.status.updated',
  SUBSCRIPTION_REQUEST_UPDATED: 'subscription.request.updated',
};
