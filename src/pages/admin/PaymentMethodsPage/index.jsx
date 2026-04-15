import { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Building2,
  User,
  Phone,
  FileText,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

import adminService from '../../../services/adminService';
import { Button, Card, Spinner, Dialog, Input } from '../../../components/ui';
import { StatsHeader, ConfirmDialog, EmptyState } from '../../../components';

const EMPTY_FORM = {
  tipo: '',
  titular: '',
  nombre_banco: '',
  numero_cuenta: '',
  cci: '',
  numero_celular: '',
};

export default function PaymentMethodsPage() {
  const { enqueueSnackbar } = useSnackbar();

  // All state via useState
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [methodToDelete, setMethodToDelete] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  // Load payment methods
  const loadMethods = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPaymentMethods();
      setMethods(Array.isArray(data) ? data : []);
    } catch {
      enqueueSnackbar('Error al cargar metodos de pago', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = methods.length;
    const active = methods.filter((m) => m.activo === true).length;
    const inactive = total - active;
    return [
      { key: 'total', label: 'Total', value: total, color: 'primary' },
      { key: 'active', label: 'Activos', value: active, color: 'success' },
      { key: 'inactive', label: 'Inactivos', value: inactive, color: 'secondary' },
    ];
  }, [methods]);

  // Derived booleans for form
  const isBanco = formData.tipo === 'BANCO';
  const isBilletera = formData.tipo === 'YAPE' || formData.tipo === 'PLIN';
  const hasType = isBanco || isBilletera;

  // Open create dialog
  const handleOpenCreate = () => {
    setEditingMethod(null);
    setFormData({ ...EMPTY_FORM });
    setShowFormDialog(true);
  };

  // Open edit dialog
  const handleOpenEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      tipo: method.tipo || '',
      titular: method.titular || '',
      nombre_banco: method.nombre_banco || '',
      numero_cuenta: method.numero_cuenta || '',
      cci: method.cci || '',
      numero_celular: method.numero_celular || '',
    });
    setShowFormDialog(true);
  };

  // Close form dialog
  const handleCloseForm = () => {
    setShowFormDialog(false);
    setEditingMethod(null);
    setFormData({ ...EMPTY_FORM });
  };

  // Submit create/update
  const handleSubmit = async () => {
    if (!formData.tipo) {
      enqueueSnackbar('El tipo de metodo es requerido', { variant: 'error' });
      return;
    }
    if (!formData.titular.trim()) {
      enqueueSnackbar('El titular es requerido', { variant: 'error' });
      return;
    }

    setFormLoading(true);
    try {
      const payload = { tipo: formData.tipo, titular: formData.titular.trim() };

      if (isBanco) {
        payload.nombre_banco = formData.nombre_banco.trim();
        payload.numero_cuenta = formData.numero_cuenta.trim();
        payload.cci = formData.cci.trim();
        payload.numero_celular = null;
      } else {
        payload.numero_celular = formData.numero_celular.trim();
        payload.nombre_banco = null;
        payload.numero_cuenta = null;
        payload.cci = null;
      }

      if (editingMethod) {
        await adminService.updatePaymentMethod(editingMethod.id, payload);
        enqueueSnackbar('Metodo de pago actualizado', { variant: 'success' });
      } else {
        await adminService.createPaymentMethod(payload);
        enqueueSnackbar('Metodo de pago creado', { variant: 'success' });
      }
      handleCloseForm();
      loadMethods();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al guardar', { variant: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle active/inactive
  const handleToggle = async (method) => {
    try {
      await adminService.updatePaymentMethod(method.id, { activo: !method.activo });
      enqueueSnackbar(
        `Metodo "${method.tipo}" ${method.activo ? 'desactivado' : 'activado'}`,
        { variant: 'success' }
      );
      loadMethods();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al cambiar estado', { variant: 'error' });
    }
  };

  // Delete
  const handleOpenDelete = (method) => {
    setMethodToDelete(method);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!methodToDelete) return;
    try {
      await adminService.deletePaymentMethod(methodToDelete.id);
      enqueueSnackbar('Metodo de pago eliminado', { variant: 'success' });
      setShowDeleteDialog(false);
      setMethodToDelete(null);
      loadMethods();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al eliminar', { variant: 'error' });
    }
  };

  // Display label for tipo
  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'YAPE': return 'Yape';
      case 'PLIN': return 'Plin';
      case 'BANCO': return 'Cuenta Bancaria';
      default: return tipo || '-';
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Metodos de Pago
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadMethods}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button
            startIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreate}
          >
            Nuevo Metodo
          </Button>
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

      {/* Methods list */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {methods.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title="No hay metodos de pago"
                message="Crea un nuevo metodo de pago para que los vendedores puedan pagar sus suscripciones."
                actionLabel="Crear Metodo"
                onAction={handleOpenCreate}
              />
            </div>
          ) : (
            methods.map((method) => (
              <Card key={method.id} className={!method.activo ? 'opacity-60' : ''}>
                <Card.Content>
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary flex-shrink-0" />
                        <h3 className="font-semibold text-gray-800 truncate">
                          {getTipoLabel(method.tipo)}
                        </h3>
                      </div>
                      {method.nombre_banco && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          {method.nombre_banco}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                        method.activo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {method.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  {/* Details */}
                  {method.titular && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <User className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{method.titular}</span>
                    </div>
                  )}

                  {method.numero_cuenta && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="font-mono truncate">Cta: {method.numero_cuenta}</span>
                    </div>
                  )}

                  {method.cci && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="font-mono truncate">CCI: {method.cci}</span>
                    </div>
                  )}

                  {method.numero_celular && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{method.numero_celular}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleToggle(method)}
                      className={`p-2 rounded-lg transition-colors ${
                        method.activo
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={method.activo ? 'Desactivar' : 'Activar'}
                    >
                      {method.activo ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(method)}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(method)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card.Content>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showFormDialog} onClose={handleCloseForm} maxWidth="sm">
        <Dialog.Header onClose={handleCloseForm}>
          {editingMethod ? 'Editar Metodo de Pago' : 'Nuevo Metodo de Pago'}
        </Dialog.Header>
        <Dialog.Content>
          <div className="space-y-4">
            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tipo de metodo <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              >
                <option value="">-- Selecciona --</option>
                <option value="YAPE">Yape</option>
                <option value="PLIN">Plin</option>
                <option value="BANCO">Cuenta Bancaria</option>
              </select>
            </div>

            {hasType && (
              <>
                {/* Titular */}
                <Input
                  label="Titular *"
                  placeholder="Nombre del titular"
                  value={formData.titular}
                  onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                />

                {/* Billetera fields */}
                {isBilletera && (
                  <Input
                    label="Numero de celular *"
                    placeholder="9 digitos"
                    value={formData.numero_celular}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setFormData({ ...formData, numero_celular: val });
                    }}
                  />
                )}

                {/* Banco fields */}
                {isBanco && (
                  <>
                    <Input
                      label="Nombre del banco *"
                      placeholder="Ej: BCP, Interbank, BBVA"
                      value={formData.nombre_banco}
                      onChange={(e) => setFormData({ ...formData, nombre_banco: e.target.value })}
                    />
                    <Input
                      label="Numero de cuenta *"
                      placeholder="Numero de cuenta principal"
                      value={formData.numero_cuenta}
                      onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
                    />
                    <Input
                      label="Cuenta Interbancaria (CCI) *"
                      placeholder="Numero de cuenta interbancaria"
                      value={formData.cci}
                      onChange={(e) => setFormData({ ...formData, cci: e.target.value })}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </Dialog.Content>
        <Dialog.Footer>
          <Button variant="outline" onClick={handleCloseForm} disabled={formLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={formLoading || !formData.tipo}
            loading={formLoading}
          >
            {editingMethod ? 'Actualizar' : 'Crear'}
          </Button>
        </Dialog.Footer>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setMethodToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Metodo de Pago?"
        message={`Estas a punto de eliminar el metodo "${getTipoLabel(methodToDelete?.tipo)}" de ${methodToDelete?.titular || ''}. Esta accion no se puede deshacer.`}
        confirmText="Si, Eliminar"
        type="error"
      />
    </div>
  );
}
