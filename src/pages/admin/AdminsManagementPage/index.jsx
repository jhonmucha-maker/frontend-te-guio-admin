import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { ShieldCheck, Plus, Users, Trash2, Pencil } from 'lucide-react';
import adminService from '../../../services/adminService';
import useAuthStore from '../../../store/useAuthStore';
import { Spinner, Button, Card, Input } from '../../../components/ui';
import { EmptyState } from '../../../components';

export default function AdminsManagementPage() {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const isPrimaryAdmin = !currentUser?.id_usuario_registro || currentUser.id_usuario_registro === currentUser.id;
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: '', correo: '', telefono: '', contrasena: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    nombres: '', apellidos: '', correo: '', contrasena: '', telefono: '',
  });

  useEffect(() => {
    if (!isPrimaryAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    loadAdmins();
  }, [isPrimaryAdmin, navigate]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAdmins();
      setAdmins(Array.isArray(data) ? data : []);
    } catch {
      enqueueSnackbar('Error al cargar administradores', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.nombres || !form.correo || !form.contrasena) {
      enqueueSnackbar('Nombre, correo y contrasena son obligatorios', { variant: 'error' });
      return;
    }
    if (form.contrasena.length < 8) {
      enqueueSnackbar('La contrasena debe tener al menos 8 caracteres', { variant: 'error' });
      return;
    }
    setCreating(true);
    try {
      await adminService.createAdmin(form);
      enqueueSnackbar('Administrador creado exitosamente', { variant: 'success' });
      setShowCreate(false);
      setForm({ nombres: '', apellidos: '', correo: '', contrasena: '', telefono: '' });
      loadAdmins();
    } catch (err) {
      enqueueSnackbar(err.message || 'Error al crear administrador', { variant: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (admin) => {
    setEditTarget(admin);
    setEditForm({
      nombre: admin.nombre || '',
      correo: admin.correo || '',
      telefono: admin.telefono || '',
      contrasena: '',
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editForm.nombre || !editForm.correo) {
      enqueueSnackbar('Nombre y correo son obligatorios', { variant: 'error' });
      return;
    }
    if (editForm.contrasena && editForm.contrasena.length < 8) {
      enqueueSnackbar('La contrasena debe tener al menos 8 caracteres', { variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: editForm.nombre,
        correo: editForm.correo,
        telefono: editForm.telefono,
      };
      if (editForm.contrasena) payload.contrasena = editForm.contrasena;
      await adminService.updateAdmin(editTarget.id, payload);
      enqueueSnackbar('Administrador actualizado exitosamente', { variant: 'success' });
      setEditTarget(null);
      loadAdmins();
    } catch (err) {
      enqueueSnackbar(err.message || 'Error al actualizar administrador', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteAdmin(deleteTarget.id);
      enqueueSnackbar('Administrador eliminado exitosamente', { variant: 'success' });
      setDeleteTarget(null);
      loadAdmins();
    } catch (err) {
      enqueueSnackbar(err.message || 'Error al eliminar administrador', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const canModify = (admin) => {
    return admin.id_usuario_registro != null && admin.id !== currentUser?.id;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Administradores</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion de cuentas administrativas</p>
        </div>
        <Button onClick={() => setShowCreate(true)} startIcon={<Plus size={18} />}>
          Nuevo Admin
        </Button>
      </div>

      {/* Stats */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center">
            <Users size={22} className="text-primary-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-primary-600">{admins.length}</p>
            <p className="text-xs text-gray-500">Total administradores</p>
          </div>
        </div>
      </Card>

      {/* List */}
      {admins.length === 0 ? (
        <EmptyState
          title="Sin administradores"
          message="Cree el primer administrador adicional"
          actionLabel="Crear administrador"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <Card key={admin.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={22} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{admin.nombre}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{admin.correo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{admin.telefono || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canModify(admin) && (
                    <>
                      <button
                        onClick={() => openEdit(admin)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Editar administrador"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(admin)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar administrador"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200/60">
                    <ShieldCheck size={14} />
                    Admin
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Nuevo Administrador</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <Input
                label="Nombres *"
                value={form.nombres}
                onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                required
              />
              <Input
                label="Apellidos"
                value={form.apellidos}
                onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
              />
              <Input
                label="Correo *"
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                required
              />
              <div>
                <Input
                  label="Contrasena *"
                  type="password"
                  value={form.contrasena}
                  onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
                  required
                  helperText="Min 8 caracteres"
                />
              </div>
              <Input
                label="Telefono"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
              <Button type="submit" loading={creating} fullWidth>
                Crear administrador
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !saving && setEditTarget(null)}>
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Editar Administrador</h2>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <Input
                label="Nombre *"
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                required
              />
              <Input
                label="Correo *"
                type="email"
                value={editForm.correo}
                onChange={(e) => setEditForm({ ...editForm, correo: e.target.value })}
                required
              />
              <Input
                label="Telefono"
                value={editForm.telefono}
                onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
              />
              <div>
                <Input
                  label="Nueva contrasena"
                  type="password"
                  value={editForm.contrasena}
                  onChange={(e) => setEditForm({ ...editForm, contrasena: e.target.value })}
                  helperText="Dejar vacio para mantener la actual. Min 8 caracteres"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outlined" onClick={() => setEditTarget(null)} disabled={saving} fullWidth>
                  Cancelar
                </Button>
                <Button type="submit" loading={saving} fullWidth>
                  Guardar cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-surface rounded-xl shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Eliminar administrador</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-1">
                Esta a punto de eliminar al administrador:
              </p>
              <p className="text-sm font-bold text-gray-900 mb-1">{deleteTarget.nombre}</p>
              <p className="text-xs text-gray-500 mb-4">{deleteTarget.correo}</p>
              <p className="text-sm text-gray-600 mb-6">
                El administrador ya no podra acceder al sistema. Esta accion no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outlined"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  fullWidth
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDelete}
                  loading={deleting}
                  fullWidth
                  className="!bg-red-600 hover:!bg-red-700 !border-red-600"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
