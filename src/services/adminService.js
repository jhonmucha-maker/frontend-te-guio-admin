import { apiService } from './api';
import api from './api';

const adminService = {
  // Dashboard
  getDashboard: () => apiService.get('/admin/dashboard'),

  // Aprobaciones - Vendedores
  getPendingSellers: () => apiService.get('/admin/approvals/sellers'),
  approveSeller: (id, data) => apiService.patch(`/admin/approvals/sellers/${id}`, data),

  // Aprobaciones - Tiendas
  getPendingStores: () => apiService.get('/admin/approvals/stores'),
  approveStore: (id, data) => apiService.patch(`/admin/approvals/stores/${id}`, data),

  // Aprobaciones - Productos
  getPendingProducts: () => apiService.get('/admin/approvals/products'),
  approveProduct: (id, data) => apiService.patch(`/admin/approvals/products/${id}`, data),

  // Aprobaciones - Suscripciones
  getPendingSubscriptions: () => apiService.get('/admin/approvals/subscriptions'),
  approveSubscription: (id, data) => apiService.patch(`/admin/approvals/subscriptions/${id}`, data),
  updateSubscriptionEndDate: (id, data) => apiService.patch(`/admin/subscriptions/${id}/end-date`, data),

  // Eliminacion masiva de rechazados
  bulkDeleteRejectedSellers: (ids) => apiService.post('/admin/approvals/sellers/bulk-delete', { ids }),
  bulkDeleteRejectedStores: (ids) => apiService.post('/admin/approvals/stores/bulk-delete', { ids }),
  bulkDeleteRejectedProducts: (ids) => apiService.post('/admin/approvals/products/bulk-delete', { ids }),
  bulkDeleteRejectedSubscriptions: (ids) => apiService.post('/admin/approvals/subscriptions/bulk-delete', { ids }),

  // Finanzas
  getFinanceSummary: () => apiService.get('/admin/finance/summary'),
  getTransactions: (params) => apiService.get('/admin/finance/transactions', params),

  // Usuarios
  getBuyers: (params) => apiService.get('/admin/users/buyers', params),
  getSellers: (params) => apiService.get('/admin/users/sellers', params),
  toggleUserActive: (id) => apiService.patch(`/admin/users/${id}/toggle-active`),
  deleteUser: (id) => apiService.delete(`/admin/users/${id}`),
  cascadeDeleteSeller: (id) => apiService.delete(`/admin/users/sellers/${id}/cascade`),

  // Config - Ciudades
  getCities: () => apiService.get('/admin/config/cities'),
  createCity: (data) => apiService.post('/admin/config/cities', data),
  updateCity: (id, data) => apiService.put(`/admin/config/cities/${id}`, data),
  deleteCity: (id) => apiService.delete(`/admin/config/cities/${id}`),

  // Config - Zonas
  getZones: () => apiService.get('/admin/config/zones'),
  createZone: (data) => apiService.post('/admin/config/zones', data),
  updateZone: (id, data) => apiService.put(`/admin/config/zones/${id}`, data),
  deleteZone: (id) => apiService.delete(`/admin/config/zones/${id}`),

  // Config - Categorias
  getCategories: () => apiService.get('/admin/config/categories'),
  createCategory: (data) => apiService.post('/admin/config/categories', data),
  updateCategory: (id, data) => apiService.put(`/admin/config/categories/${id}`, data),
  deleteCategory: (id) => apiService.delete(`/admin/config/categories/${id}`),

  // Config - Galerias
  getGalleries: () => apiService.get('/admin/config/galleries'),
  createGallery: (data) => apiService.post('/admin/config/galleries', data),
  updateGallery: (id, data) => apiService.put(`/admin/config/galleries/${id}`, data),
  deleteGallery: (id) => apiService.delete(`/admin/config/galleries/${id}`),

  // Config - FAQs
  getFaqs: () => apiService.get('/admin/config/faqs'),
  createFaq: (data) => apiService.post('/admin/config/faqs', data),
  updateFaq: (id, data) => apiService.put(`/admin/config/faqs/${id}`, data),
  deleteFaq: (id) => apiService.delete(`/admin/config/faqs/${id}`),

  // Config - Metodos de pago
  getPaymentMethods: () => apiService.get('/admin/config/payment-methods'),
  createPaymentMethod: (data) => apiService.post('/admin/config/payment-methods', data),
  updatePaymentMethod: (id, data) => apiService.put(`/admin/config/payment-methods/${id}`, data),
  deletePaymentMethod: (id) => apiService.delete(`/admin/config/payment-methods/${id}`),

  // Config - Planes
  getPlans: () => apiService.get('/admin/config/plans'),
  updatePlan: (id, data) => apiService.patch(`/admin/config/plans/${id}`, data),

  // Config - Plan Features
  getPlanFeatures: (planId) => apiService.get(`/admin/config/plans/${planId}/features`),
  createPlanFeature: (planId, data) => apiService.post(`/admin/config/plans/${planId}/features`, data),
  updatePlanFeature: (planId, featureId, data) => apiService.patch(`/admin/config/plans/${planId}/features/${featureId}`, data),
  deletePlanFeature: (planId, featureId) => apiService.delete(`/admin/config/plans/${planId}/features/${featureId}`),
  reorderPlanFeatures: (planId, ids) => apiService.post(`/admin/config/plans/${planId}/features/reorder`, { ids }),

  // Config - Sistema
  getSystemConfig: () => apiService.get('/admin/config/system'),
  updateSystemConfig: (id, data) => apiService.patch(`/admin/config/system/${id}`, data),

  // Tickets
  getAllTickets: (params) => apiService.get('/tickets', params),

  // Reportes
  getReports: (params) => apiService.get('/admin/reports', params),
  getInactiveUsers: (params) => apiService.get('/admin/reports/inactive-users', params),

  // Admins
  getAdmins: () => apiService.get('/admin/admins'),
  createAdmin: (data) => apiService.post('/admin/admins', data),
  updateAdmin: (id, data) => apiService.put(`/admin/admins/${id}`, data),
  deleteAdmin: (id) => apiService.delete(`/admin/admins/${id}`),

  // Export (necesita responseType blob - usa instancia raw)
  exportSellersExcel: () => api.get('/admin/export/sellers', { responseType: 'blob' }),

  // Fotos de galeria
  addGalleryPhotos: (id, formData) => apiService.upload(`/admin/galleries/${id}/photos`, formData),
  deleteGalleryPhoto: (galleryId, photoId) => apiService.delete(`/admin/galleries/${galleryId}/photos/${photoId}`),

  // Terminos y condiciones
  getTerms: () => apiService.get('/admin/config/terms'),
  createTerms: (data) => apiService.post('/admin/config/terms', data),
  updateTerms: (id, data) => apiService.put(`/admin/config/terms/${id}`, data),
  deleteTerms: (id) => apiService.delete(`/admin/config/terms/${id}`),

  // Politica de privacidad
  getPrivacy: () => apiService.get('/admin/config/privacy'),
  createPrivacy: (data) => apiService.post('/admin/config/privacy', data),
  updatePrivacy: (id, data) => apiService.put(`/admin/config/privacy/${id}`, data),
  deletePrivacy: (id) => apiService.delete(`/admin/config/privacy/${id}`),

  // Email templates
  getEmailTemplates: () => apiService.get('/admin/config/email-templates'),
  updateEmailTemplate: (id, data) => apiService.put(`/admin/config/email-templates/${id}`, data),
  resetEmailTemplates: () => apiService.post('/admin/config/email-templates/reset'),
  previewEmailTemplate: (data) => apiService.post('/admin/config/email-templates/preview', data),

  // Notificaciones Push
  getPushNotifications: () => apiService.get('/admin/config/push-notifications'),
  updatePushNotification: (id, data) => apiService.put(`/admin/config/push-notifications/${id}`, data),
  resetPushNotifications: () => apiService.post('/admin/config/push-notifications/reset'),
};

export default adminService;
