import { useState, useEffect, useMemo, useRef } from 'react';
import { Bell, RefreshCw, Pencil, RotateCcw } from 'lucide-react';
import { useSnackbar } from 'notistack';
import adminService from '../../../services/adminService';
import { Button, Card, Dialog, Input, Switch, Spinner } from '../../../components/ui';
import { StatsHeader, ConfirmDialog, EmptyState } from '../../../components';

const EVENT_LABELS = {
  'favorites.updated': 'Favoritos actualizados',
  'shopping_list.updated': 'Lista de compras actualizada',
  'ticket.message.created': 'Nuevo mensaje en ticket',
  'ticket.status.updated': 'Estado de ticket actualizado',
  'ticket.created': 'Ticket creado',
  'approval.seller.approved': 'Vendedor aprobado',
  'approval.seller.rejected': 'Vendedor rechazado',
  'approval.store.approved': 'Tienda aprobada',
  'approval.store.rejected': 'Tienda rechazada',
  'approval.store.updated': 'Tienda habilitada/deshabilitada',
  'approval.product.approved': 'Producto aprobado',
  'approval.product.rejected': 'Producto rechazado',
  'approval.product.updated': 'Producto habilitado/deshabilitado',
  'subscription.request.updated': 'Solicitud de suscripcion',
  'subscription.active.updated': 'Suscripcion activa actualizada',
  'subscription.expiring': 'Suscripcion por vencer',
  'product.price.changed': 'Cambio de precio de producto',
  'admin.pending.seller': 'Solicitud de nuevo vendedor',
  'admin.pending.store': 'Solicitud de nueva tienda',
  'admin.pending.product': 'Solicitud de nuevo producto',
  'admin.pending.subscription': 'Solicitud de suscripcion',
  'rating.product.new': 'Nueva calificacion de producto',
  'rating.store.new': 'Nueva calificacion de tienda',
};

// Descripcion de a quien se envia cada notificacion
// El destinatario esta definido en el codigo del backend (notificationService.js) y no es editable desde aqui
const TARGET_INFO = {
  'favorites.updated':             { label: 'Comprador afectado',       desc: 'Se envia al comprador que modifico sus favoritos',         color: 'bg-green-100 text-green-700' },
  'shopping_list.updated':         { label: 'Comprador afectado',       desc: 'Se envia al comprador que modifico su lista de compras',   color: 'bg-green-100 text-green-700' },
  'ticket.message.created':        { label: 'Participantes del ticket', desc: 'Se envia a todos los participantes excepto el autor',      color: 'bg-amber-100 text-amber-700' },
  'ticket.status.updated':         { label: 'Participantes del ticket', desc: 'Se envia a todos los participantes del ticket',            color: 'bg-amber-100 text-amber-700' },
  'ticket.created':                { label: 'Usuarios asignados',       desc: 'Se envia a los usuarios involucrados en el nuevo ticket',  color: 'bg-amber-100 text-amber-700' },
  'approval.seller.approved':      { label: 'Vendedor solicitante',     desc: 'Se envia al vendedor cuando su solicitud es aprobada',      color: 'bg-blue-100 text-blue-700' },
  'approval.seller.rejected':      { label: 'Vendedor solicitante',     desc: 'Se envia al vendedor cuando su solicitud es rechazada',     color: 'bg-blue-100 text-blue-700' },
  'approval.store.approved':       { label: 'Vendedor de la tienda',    desc: 'Se envia al vendedor cuando su tienda es aprobada',         color: 'bg-blue-100 text-blue-700' },
  'approval.store.rejected':       { label: 'Vendedor de la tienda',    desc: 'Se envia al vendedor cuando su tienda es rechazada',        color: 'bg-blue-100 text-blue-700' },
  'approval.store.updated':        { label: 'Vendedor de la tienda',    desc: 'Se envia al vendedor cuando su tienda es habilitada/deshabilitada', color: 'bg-blue-100 text-blue-700' },
  'approval.product.approved':     { label: 'Vendedor del producto',    desc: 'Se envia al vendedor cuando su producto es aprobado',       color: 'bg-blue-100 text-blue-700' },
  'approval.product.rejected':     { label: 'Vendedor del producto',    desc: 'Se envia al vendedor cuando su producto es rechazado',      color: 'bg-blue-100 text-blue-700' },
  'approval.product.updated':      { label: 'Vendedor del producto',    desc: 'Se envia al vendedor cuando su producto es habilitado/deshabilitado', color: 'bg-blue-100 text-blue-700' },
  'subscription.request.updated':  { label: 'Vendedor + Admins',        desc: 'Se envia al vendedor solicitante y a los administradores', color: 'bg-indigo-100 text-indigo-700' },
  'subscription.active.updated':   { label: 'Vendedor afectado',        desc: 'Se envia al vendedor dueño de la suscripcion',             color: 'bg-blue-100 text-blue-700' },
  'subscription.expiring':         { label: 'Vendedor afectado',        desc: 'Se envia al vendedor cuya suscripcion esta por vencer',    color: 'bg-blue-100 text-blue-700' },
  'product.price.changed':         { label: 'Compradores interesados',  desc: 'Se envia a compradores con el producto en favoritos',      color: 'bg-green-100 text-green-700' },
  'admin.pending.seller':          { label: 'Todos los administradores', desc: 'Se envia cuando un vendedor nuevo solicita aprobacion',    color: 'bg-purple-100 text-purple-700' },
  'admin.pending.store':           { label: 'Todos los administradores', desc: 'Se envia cuando una tienda solicita aprobacion',           color: 'bg-purple-100 text-purple-700' },
  'admin.pending.product':         { label: 'Todos los administradores', desc: 'Se envia cuando un producto solicita aprobacion',          color: 'bg-purple-100 text-purple-700' },
  'admin.pending.subscription':    { label: 'Todos los administradores', desc: 'Se envia cuando un vendedor solicita una suscripcion',     color: 'bg-purple-100 text-purple-700' },
  'rating.product.new':            { label: 'Vendedor del producto',    desc: 'Se envia al vendedor dueño del producto calificado',        color: 'bg-blue-100 text-blue-700' },
  'rating.store.new':              { label: 'Vendedor de la tienda',    desc: 'Se envia al vendedor dueño de la tienda calificada',        color: 'bg-blue-100 text-blue-700' },
};

const getTargetInfo = (evento) => TARGET_INFO[evento] || { label: 'Usuario especifico', desc: '', color: 'bg-gray-100 text-gray-600' };

// Descripcion legible de cada variable para la seccion informativa
const VAR_DESCRIPTIONS = {
  nombre_vendedor: 'Nombre del vendedor',
  nombre_tienda: 'Nombre de la tienda',
  nombre_producto: 'Nombre del producto',
  nombre_plan: 'Nombre del plan de suscripcion',
  precio_plan: 'Precio del plan (ej: S/ 15.00)',
  duracion_plan: 'Duracion del plan (ej: 30 dias)',
  estado: 'Estado de la accion (APROBADO, RECHAZADO)',
  motivo: 'Motivo de rechazo (si aplica)',
  ticket_id: 'ID del ticket',
  status: 'Estado actual',
  product_id: 'ID del producto',
  id_producto: 'ID del producto',
  id_tienda: 'ID de la tienda',
  entity_type: 'Tipo de entidad (seller, store, product)',
};

export default function PushNotificationsPage() {
  const { enqueueSnackbar } = useSnackbar();

  const [items, setItems] = useState([]);
  const [variableMap, setVariableMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ titulo: '', mensaje: '', activo: true });
  const [lastFocusedField, setLastFocusedField] = useState('mensaje');
  const titleRef = useRef(null);
  const bodyRef = useRef(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPushNotifications();
      // Soportar formato nuevo { items, variables } y legacy (array)
      if (data && data.items) {
        setItems(Array.isArray(data.items) ? data.items : []);
        setVariableMap(data.variables || {});
      } else {
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al cargar configuracion', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter(i => i.activo).length;
    const inactive = total - active;
    return [
      { key: 'total', label: 'Total eventos', value: total, color: 'primary' },
      { key: 'active', label: 'Activas', value: active, color: 'success' },
      { key: 'inactive', label: 'Inactivas', value: inactive, color: 'secondary' },
    ];
  }, [items]);

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      titulo: item.titulo || '',
      mensaje: item.mensaje || '',
      activo: item.activo,
    });
    setShowEditDialog(true);
  };

  const handleCloseEdit = () => {
    setShowEditDialog(false);
    setEditingItem(null);
  };

  const handleSubmit = async () => {
    if (!formData.titulo.trim() || !formData.mensaje.trim()) {
      enqueueSnackbar('Titulo y mensaje son obligatorios', { variant: 'error' });
      return;
    }

    setFormLoading(true);
    try {
      await adminService.updatePushNotification(editingItem.id, {
        titulo: formData.titulo,
        mensaje: formData.mensaje,
        activo: formData.activo,
      });
      enqueueSnackbar('Notificacion actualizada correctamente', { variant: 'success' });
      handleCloseEdit();
      loadItems();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al actualizar', { variant: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await adminService.updatePushNotification(item.id, { activo: !item.activo });
      enqueueSnackbar(
        `Notificacion "${item.titulo}" ${!item.activo ? 'activada' : 'desactivada'}`,
        { variant: 'success' }
      );
      loadItems();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al cambiar estado', { variant: 'error' });
    }
  };

  const handleReset = async () => {
    try {
      await adminService.resetPushNotifications();
      enqueueSnackbar('Configuracion restaurada a valores predeterminados', { variant: 'success' });
      setShowResetDialog(false);
      loadItems();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al restaurar', { variant: 'error' });
    }
  };


  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Notificaciones Push
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            startIcon={<RotateCcw className="w-4 h-4" />}
            onClick={() => setShowResetDialog(true)}
          >
            <span className="hidden sm:inline">Restaurar</span>
          </Button>
          <button
            onClick={loadItems}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsHeader stats={stats} />

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* Table */}
      {!loading && items.length === 0 && (
        <EmptyState
          title="Sin configuracion"
          message="No hay notificaciones push configuradas"
        />
      )}

      {!loading && items.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Evento</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Titulo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Mensaje</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Destinatario</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Activa</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!item.activo ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">
                        {EVENT_LABELS[item.evento] || item.evento}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">{item.evento}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.titulo}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-xs truncate">
                      {item.mensaje}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {(() => {
                        const info = getTargetInfo(item.evento);
                        return (
                          <div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
                              {info.label}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={item.activo}
                        onChange={() => handleToggleActive(item)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onClose={handleCloseEdit} maxWidth="md">
        <Dialog.Header onClose={handleCloseEdit}>
          Editar Notificacion Push
        </Dialog.Header>
        <Dialog.Content>
          {editingItem && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Evento</p>
                <p className="font-medium text-gray-800">{EVENT_LABELS[editingItem.evento] || editingItem.evento}</p>
                <p className="text-xs text-gray-400 font-mono">{editingItem.evento}</p>
              </div>

              {/* Variables disponibles para insertar */}
              {(variableMap[editingItem.evento] || []).length > 0 && (
                <div className="rounded-xl border border-purple-200 overflow-hidden">
                  <div className="bg-purple-50 px-3 py-2 border-b border-purple-200">
                    <p className="text-xs font-bold text-purple-700">Variables dinamicas</p>
                    <p className="text-[11px] text-purple-500 mt-0.5">Clic en una variable para insertarla en el campo activo (titulo o mensaje)</p>
                  </div>
                  <div className="p-3 bg-surface">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {variableMap[editingItem.evento].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            const tag = `{{${v}}}`;
                            const field = lastFocusedField;
                            const inputEl = field === 'titulo' ? titleRef.current : bodyRef.current;
                            if (inputEl) {
                              const start = inputEl.selectionStart;
                              const end = inputEl.selectionEnd;
                              const cur = formData[field];
                              const newVal = cur.substring(0, start) + tag + cur.substring(end);
                              setFormData((prev) => ({ ...prev, [field]: newVal }));
                              setTimeout(() => {
                                inputEl.selectionStart = inputEl.selectionEnd = start + tag.length;
                                inputEl.focus();
                              }, 0);
                            } else {
                              setFormData((prev) => ({ ...prev, mensaje: prev.mensaje + tag }));
                            }
                          }}
                          className="px-2.5 py-1 rounded-md border border-purple-300 bg-purple-50 text-xs font-mono text-purple-700 hover:bg-purple-100 hover:border-purple-400 transition-colors"
                        >
                          {`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 pt-2 space-y-1">
                      {variableMap[editingItem.evento].map((v) => (
                        <div key={v} className="flex items-start gap-2 text-[11px]">
                          <code className="text-purple-600 font-bold whitespace-nowrap">{`{{${v}}}`}</code>
                          <span className="text-gray-500">{VAR_DESCRIPTIONS[v] || v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Titulo *
                </label>
                <input
                  ref={titleRef}
                  type="text"
                  placeholder="Titulo de la notificacion"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  onFocus={() => setLastFocusedField('titulo')}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-colors duration-150 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mensaje *
                </label>
                <textarea
                  ref={bodyRef}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-colors duration-150 text-sm"
                  rows={3}
                  placeholder="Mensaje de la notificacion"
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  onFocus={() => setLastFocusedField('mensaje')}
                />
              </div>

              {(() => {
                const info = getTargetInfo(editingItem.evento);
                return (
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <p className="text-xs font-semibold text-blue-700 mb-0.5">Destinatario</p>
                    <p className="text-sm font-medium text-blue-800">{info.label}</p>
                    {info.desc && <p className="text-xs text-blue-600 mt-1">{info.desc}</p>}
                  </div>
                );
              })()}

              <Switch
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                label={formData.activo ? 'Notificacion activa' : 'Notificacion inactiva'}
              />
            </div>
          )}
        </Dialog.Content>
        <Dialog.Footer>
          <Button variant="outline" onClick={handleCloseEdit} disabled={formLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={formLoading || !formData.titulo.trim() || !formData.mensaje.trim()}
            loading={formLoading}
          >
            Guardar
          </Button>
        </Dialog.Footer>
      </Dialog>

      {/* Reset Confirm */}
      <ConfirmDialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleReset}
        title="Restaurar configuracion?"
        message="Todos los titulos, mensajes y destinatarios volveran a sus valores predeterminados. Las notificaciones desactivadas se reactivaran."
        confirmText="Si, Restaurar"
        type="warning"
      />
    </div>
  );
}
