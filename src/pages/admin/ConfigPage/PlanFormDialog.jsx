import { useState, useEffect } from 'react';
import { GripVertical, Pencil, Trash2, Plus, Check, X, Loader2 } from 'lucide-react';
import { useSnackbar } from 'notistack';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import adminService from '../../../services/adminService';
import { Button, Dialog } from '../../../components/ui';

// ---- Sortable Feature Item ----
function SortableFeatureItem({ feature, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(feature.texto);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feature.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (text.trim().length < 3) return;
    onEdit(feature.id, text.trim());
    setEditing(false);
  };

  const handleCancel = () => {
    setText(feature.texto);
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg group"
    >
      <button
        type="button"
        className="cursor-grab text-gray-400 hover:text-gray-600 shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {editing ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
            maxLength={200}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <button type="button" onClick={handleSave} className="text-green-600 hover:text-green-700 p-1">
            <Check className="w-4 h-4" />
          </button>
          <button type="button" onClick={handleCancel} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm text-gray-700 truncate">{feature.texto}</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary p-1 transition-opacity"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(feature.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

// ---- Main Dialog ----
export default function PlanFormDialog({ open, onClose, editItem, onSaved }) {
  const { enqueueSnackbar } = useSnackbar();
  const [saving, setSaving] = useState(false);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [features, setFeatures] = useState([]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [addingFeature, setAddingFeature] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    precio: '',
    duracion_dias: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (open && editItem) {
      setForm({
        nombre: editItem.nombre || '',
        precio: editItem.precio?.toString() || '',
        duracion_dias: editItem.duracion_dias?.toString() || '',
      });
      loadFeatures(editItem.id);
    }
  }, [open, editItem]);

  const loadFeatures = async (planId) => {
    setLoadingFeatures(true);
    try {
      const data = await adminService.getPlanFeatures(planId);
      setFeatures(Array.isArray(data) ? data : []);
    } catch {
      enqueueSnackbar('Error al cargar caracteristicas', { variant: 'error' });
    } finally {
      setLoadingFeatures(false);
    }
  };

  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    try {
      await adminService.updatePlan(editItem.id, {
        nombre: form.nombre,
        precio: parseFloat(form.precio),
        duracion_dias: parseInt(form.duracion_dias),
      });
      enqueueSnackbar('Plan actualizado', { variant: 'success' });
      onSaved();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || 'Error al actualizar plan', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddFeature = async () => {
    if (!editItem || newFeatureText.trim().length < 3) return;
    setAddingFeature(true);
    try {
      const created = await adminService.createPlanFeature(editItem.id, { texto: newFeatureText.trim() });
      setFeatures((prev) => [...prev, created]);
      setNewFeatureText('');
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || 'Error al agregar', { variant: 'error' });
    } finally {
      setAddingFeature(false);
    }
  };

  const handleEditFeature = async (featureId, texto) => {
    try {
      const updated = await adminService.updatePlanFeature(editItem.id, featureId, { texto });
      setFeatures((prev) => prev.map((f) => (f.id === featureId ? updated : f)));
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || 'Error al editar', { variant: 'error' });
    }
  };

  const handleDeleteFeature = async (featureId) => {
    try {
      await adminService.deletePlanFeature(editItem.id, featureId);
      setFeatures((prev) => prev.filter((f) => f.id !== featureId));
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || 'Error al eliminar', { variant: 'error' });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = features.findIndex((f) => f.id === active.id);
    const newIndex = features.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(features, oldIndex, newIndex);

    setFeatures(reordered);

    try {
      const ids = reordered.map((f) => f.id);
      await adminService.reorderPlanFeatures(editItem.id, ids);
    } catch {
      loadFeatures(editItem.id);
      enqueueSnackbar('Error al reordenar', { variant: 'error' });
    }
  };

  const planLabel = editItem?.tipo === 'ESTANDAR' ? 'Plan Estandar' : editItem?.tipo === 'PREMIUM' ? 'Plan Premium' : editItem?.tipo || '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      <Dialog.Header onClose={onClose}>Editar {planLabel}</Dialog.Header>
      <Dialog.Content>
        <form onSubmit={handleSubmitPlan} className="space-y-4" id="plan-form">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
            <input
              type="text"
              value={planLabel}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre visible <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Precio (S/) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Duracion (dias) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.duracion_dias}
                onChange={(e) => setForm({ ...form, duracion_dias: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                required
              />
            </div>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Caracteristicas del plan</h4>

          {loadingFeatures ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={features.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5 mb-3">
                    {features.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">
                        No hay caracteristicas. Agrega una abajo.
                      </p>
                    )}
                    {features.map((feature) => (
                      <SortableFeatureItem
                        key={feature.id}
                        feature={feature}
                        onEdit={handleEditFeature}
                        onDelete={handleDeleteFeature}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  placeholder="Nueva caracteristica..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  maxLength={200}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddFeature}
                  disabled={addingFeature || newFeatureText.trim().length < 3}
                  loading={addingFeature}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog.Content>
      <Dialog.Footer>
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
        <Button type="submit" form="plan-form" disabled={saving} loading={saving}>
          Actualizar Plan
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}
