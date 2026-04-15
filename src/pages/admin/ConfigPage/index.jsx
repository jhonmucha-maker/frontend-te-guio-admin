import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Settings,
  Building2,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  MapPin,
  Store,
  HelpCircle,
  FileText,
  CreditCard,
  User,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Shield,
  Mail,
  Navigation,
  Image,
  X,
  Camera,
  Map,
  RotateCcw,
  Eye,
  EyeOff,
  Lock,
  Type,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import adminService from '../../../services/adminService';
import api from '../../../services/api';
import { ConfirmDialog } from '../../../components';
import { Button, Card, Dialog, Spinner } from '../../../components/ui';
import PlanFormDialog from './PlanFormDialog';

// -- Leaflet icon fix for Vite --
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const galleryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// -- Map helper components --
const LocationMarker = ({ position, onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return position ? <Marker position={position} icon={galleryIcon} /> : null;
};

const MapCenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

// ============================================================
// Data-driven section definitions
// ============================================================
const sections = [
  {
    key: 'cities',
    label: 'Ciudades',
    displayLabel: 'Gestion de Ciudades',
    icon: Building2,
    fields: [{ name: 'nombre', label: 'Nombre', required: true }],
  },
  {
    key: 'zones',
    label: 'Zonas',
    displayLabel: 'Gestion de Zonas',
    icon: MapPin,
    fields: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'id_ciudad', label: 'Ciudad', type: 'number', required: true, select: 'cities' },
    ],
  },
  {
    key: 'categories',
    label: 'Categorias',
    displayLabel: 'Gestion de Categorias',
    icon: LayoutGrid,
    fields: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'descripcion', label: 'Descripcion' },
    ],
  },
  {
    key: 'galleries',
    label: 'Galerias',
    displayLabel: 'Gestion de Galerias',
    icon: Store,
    customForm: true,
    fields: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'direccion', label: 'Direccion' },
      { name: 'id_zona', label: 'Zona', type: 'number', required: true, select: 'zones' },
    ],
  },
  {
    key: 'faqs-compradores',
    label: 'FAQs Compradores',
    displayLabel: 'FAQs Compradores',
    icon: HelpCircle,
    fields: [
      { name: 'pregunta', label: 'Pregunta', required: true },
      { name: 'respuesta', label: 'Respuesta', required: true, textarea: true },
    ],
    filter: (items) => items.filter((i) => i.audiencia === 'BUYER' || i.audiencia === 'ALL'),
    defaultValues: { audiencia: 'BUYER' },
  },
  {
    key: 'faqs-vendedores',
    label: 'FAQs Vendedores',
    displayLabel: 'FAQs Vendedores',
    icon: HelpCircle,
    fields: [
      { name: 'pregunta', label: 'Pregunta', required: true },
      { name: 'respuesta', label: 'Respuesta', required: true, textarea: true },
    ],
    filter: (items) => items.filter((i) => i.audiencia === 'SELLER' || i.audiencia === 'ALL'),
    defaultValues: { audiencia: 'SELLER' },
  },
  {
    key: 'payment-methods',
    label: 'Metodos de Pago',
    displayLabel: 'Metodos de Pago',
    icon: CreditCard,
    customForm: true,
    fields: [],
  },
  {
    key: 'terms-privacy',
    label: 'Terminos y Condiciones',
    displayLabel: 'Terminos y Condiciones',
    icon: FileText,
    customInline: true,
    fields: [],
  },
  {
    key: 'email-templates',
    label: 'Plantillas Email',
    displayLabel: 'Plantillas de Email',
    icon: Mail,
    customInline: true,
    fields: [],
  },
  {
    key: 'plans',
    label: 'Planes de Suscripcion',
    displayLabel: 'Planes de Suscripcion',
    icon: CreditCard,
    noCreate: true,
    noDelete: true,
    fields: [
      {
        name: 'tipo',
        label: 'Tipo',
        readOnly: true,
        displayFormat: (v) =>
          v === 'ESTANDAR' ? 'Plan Estandar' : v === 'PREMIUM' ? 'Plan Premium' : v,
      },
      { name: 'nombre', label: 'Nombre visible', required: true },
      { name: 'precio', label: 'Precio (S/)', type: 'number', required: true, decimal: true },
      { name: 'duracion_dias', label: 'Duracion (dias)', type: 'number', required: true },
    ],
  },
  {
    key: 'system-config',
    label: 'Config. Sistema',
    displayLabel: 'Config. Sistema',
    icon: Settings,
    noCreate: true,
    noDelete: true,
    fields: [
      {
        name: 'clave',
        label: 'Parametro',
        readOnly: true,
        displayFormat: (v) => {
          const labels = {
            dias_alerta_vencimiento_suscripcion: 'Dias alerta vencimiento suscripcion (email)',
            dias_filtro_por_vencer_suscripcion: 'Dias filtro "por vencer" suscripciones',
          };
          return labels[v] || v;
        },
      },
      { name: 'valor', label: 'Valor', required: true },
      { name: 'descripcion', label: 'Descripcion', readOnly: true },
    ],
  },
];

// Service map -- adminService methods return data directly (apiService auto-extracts .data)
const serviceMap = {
  cities: {
    get: () => adminService.getCities(),
    create: (d) => adminService.createCity(d),
    update: (id, d) => adminService.updateCity(id, d),
    del: (id) => adminService.deleteCity(id),
  },
  zones: {
    get: () => adminService.getZones(),
    create: (d) => adminService.createZone(d),
    update: (id, d) => adminService.updateZone(id, d),
    del: (id) => adminService.deleteZone(id),
  },
  categories: {
    get: () => adminService.getCategories(),
    create: (d) => adminService.createCategory(d),
    update: (id, d) => adminService.updateCategory(id, d),
    del: (id) => adminService.deleteCategory(id),
  },
  galleries: {
    get: () => adminService.getGalleries(),
    create: (d) => adminService.createGallery(d),
    update: (id, d) => adminService.updateGallery(id, d),
    del: (id) => adminService.deleteGallery(id),
  },
  'faqs-compradores': {
    get: () => adminService.getFaqs(),
    create: (d) => adminService.createFaq(d),
    update: (id, d) => adminService.updateFaq(id, d),
    del: (id) => adminService.deleteFaq(id),
  },
  'faqs-vendedores': {
    get: () => adminService.getFaqs(),
    create: (d) => adminService.createFaq(d),
    update: (id, d) => adminService.updateFaq(id, d),
    del: (id) => adminService.deleteFaq(id),
  },
  'payment-methods': {
    get: () => adminService.getPaymentMethods(),
    create: (d) => adminService.createPaymentMethod(d),
    update: (id, d) => adminService.updatePaymentMethod(id, d),
    del: (id) => adminService.deletePaymentMethod(id),
  },
  'terms-privacy': { get: async () => [] },
  'email-templates': { get: async () => [] },
  plans: {
    get: () => adminService.getPlans(),
    update: (id, d) => adminService.updatePlan(id, d),
  },
  'system-config': {
    get: () => adminService.getSystemConfig(),
    update: (id, d) => adminService.updateSystemConfig(id, d),
  },
};

// ============================================================
// Main ConfigPage component
// ============================================================
const ConfigPage = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [activeSection, setActiveSection] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectOptions, setSelectOptions] = useState({});

  const section = sections.find((s) => s.key === activeSection);
  const svc = activeSection ? serviceMap[activeSection] : null;

  // Load items when section changes
  const loadItems = useCallback(async () => {
    if (!svc || !activeSection) return;
    // Skip load for custom inline sections
    const sec = sections.find((s) => s.key === activeSection);
    if (sec?.customInline) return;
    setLoading(true);
    try {
      const data = await svc.get();
      const arr = Array.isArray(data) ? data : [];
      setItems(sec?.filter ? sec.filter(arr) : arr);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeSection, svc]);

  useEffect(() => {
    if (activeSection) loadItems();
  }, [activeSection, loadItems]);

  // Load select options for fields that need them
  useEffect(() => {
    if (!activeSection || !section) return;
    const selectFields = section.fields.filter((f) => f.select);
    if (selectFields.length === 0) return;
    const loaders = {
      cities: () => adminService.getCities(),
      zones: () => adminService.getZones(),
    };
    selectFields.forEach(async (f) => {
      if (loaders[f.select]) {
        try {
          const data = await loaders[f.select]();
          setSelectOptions((prev) => ({ ...prev, [f.select]: Array.isArray(data) ? data : [] }));
        } catch {
          // ignore
        }
      }
    });
  }, [activeSection, section]);

  const openCreate = () => {
    if (!section) return;
    const initial = {};
    section.fields.forEach((f) => (initial[f.name] = ''));
    setForm(initial);
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    if (!section) return;
    const initial = {};
    section.fields.forEach((f) => (initial[f.name] = item[f.name]?.toString() || ''));
    setForm(initial);
    setEditItem(item);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!svc || !section) return;
    setSaving(true);
    try {
      const payload = { ...form, ...(section.defaultValues || {}) };
      section.fields.forEach((f) => {
        if (f.readOnly) {
          delete payload[f.name];
          return;
        }
        if (f.type === 'number' && payload[f.name]) {
          payload[f.name] = f.decimal ? parseFloat(payload[f.name]) : parseInt(payload[f.name]);
        }
      });

      if (editItem) {
        await svc.update(editItem.id, payload);
        enqueueSnackbar('Actualizado correctamente', { variant: 'success' });
      } else {
        await svc.create(payload);
        enqueueSnackbar('Creado correctamente', { variant: 'success' });
      }
      setShowForm(false);
      loadItems();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al guardar', {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !svc?.del) return;
    try {
      await svc.del(deleteTarget);
      enqueueSnackbar('Eliminado correctamente', { variant: 'success' });
      setDeleteTarget(null);
      loadItems();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al eliminar', {
        variant: 'error',
      });
    }
  };

  // Render item display info
  const renderItemInfo = (item) => {
    if (!section) return null;

    if (activeSection === 'payment-methods') {
      return (
        <>
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {item.tipo === 'BANCO' ? `Banco - ${item.nombre_banco || ''}` : item.tipo}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {item.titular || '-'}
            {item.tipo === 'BANCO'
              ? ` | Cta: ${item.numero_cuenta || '-'} | CCI: ${item.cci || '-'}`
              : ` | Cel: ${item.numero_celular || '-'}`}
          </p>
        </>
      );
    }

    if (activeSection === 'galleries') {
      return (
        <>
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {item.nombre || '-'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {item.tbl_ciudades?.nombre || '-'} | {item.tbl_zonas?.nombre || '-'}
            {item.direccion ? ` | ${item.direccion}` : ''}
            {item.fotos?.length > 0 ? ` | ${item.fotos.length} foto(s)` : ''}
          </p>
        </>
      );
    }

    if (activeSection === 'zones') {
      return (
        <>
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {item.nombre || '-'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            Ciudad: {item.tbl_ciudades?.nombre || '-'}
          </p>
        </>
      );
    }

    if (activeSection === 'plans') {
      return (
        <>
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {item.nombre || (item.tipo === 'ESTANDAR' ? 'Plan Estandar' : item.tipo === 'PREMIUM' ? 'Plan Premium' : item.tipo)}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            S/{parseFloat(item.precio).toFixed(2)} | {item.duracion_dias} dias
          </p>
        </>
      );
    }

    if (activeSection === 'system-config') {
      return (
        <>
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {section.fields[0]?.displayFormat
              ? section.fields[0].displayFormat(item[section.fields[0].name])
              : item[section.fields[0]?.name] || '-'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            Valor: {item.valor} {item.descripcion ? `| ${item.descripcion}` : ''}
          </p>
        </>
      );
    }

    // Default rendering for simple sections
    const firstField = section.fields[0];
    return (
      <>
        <h3 className="text-sm font-semibold text-gray-900 truncate">
          {firstField?.displayFormat
            ? firstField.displayFormat(item[firstField.name])
            : item[firstField?.name] || '-'}
        </h3>
        {section.fields.length > 1 && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {section.fields
              .slice(1)
              .map((f) => {
                if (f.textarea)
                  return (
                    (item[f.name]?.substring(0, 60) || '-') +
                    (item[f.name]?.length > 60 ? '...' : '')
                  );
                if (f.select) {
                  const opt = (selectOptions[f.select] || []).find((o) => o.id === item[f.name]);
                  return opt ? opt.nombre : item[f.name] || '-';
                }
                return item[f.name] || '-';
              })
              .join(' | ')}
          </p>
        )}
      </>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-3">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-4">
        <Settings className="w-7 h-7 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Configuracion del Sistema
        </h1>
      </div>

      {/* Accordion sections */}
      {sections.map((s) => {
        const isExpanded = activeSection === s.key;
        const SectionIcon = s.icon;
        return (
          <Card key={s.key} className="!p-0 overflow-hidden">
            <button
              onClick={() => setActiveSection(isExpanded ? null : s.key)}
              className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all duration-200 ${
                isExpanded
                  ? 'bg-primary text-white'
                  : 'bg-surface text-gray-800 hover:bg-gray-50'
              }`}
            >
              <SectionIcon
                className={`w-5 h-5 flex-shrink-0 ${
                  isExpanded ? 'text-white/80' : 'text-primary'
                }`}
              />
              <span className="flex-1 text-sm font-bold">{s.displayLabel}</span>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 flex-shrink-0" />
              )}
            </button>

            {isExpanded && (
              <div className="p-4">
                {s.key === 'email-templates' ? (
                  <EmailTemplatesEditor />
                ) : s.key === 'terms-privacy' ? (
                  <TermsPrivacyEditor />
                ) : (
                  <>
                    {!s.noCreate && (
                      <div className="mb-4">
                        <Button
                          size="sm"
                          startIcon={<Plus className="w-4 h-4" />}
                          onClick={openCreate}
                        >
                          Agregar
                        </Button>
                      </div>
                    )}

                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Spinner size="lg" />
                      </div>
                    ) : items.length === 0 ? (
                      <p className="text-center text-gray-500 py-8 text-sm">Sin registros</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 font-medium text-gray-700">
                                #
                              </th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">
                                Info
                              </th>
                              <th className="text-right py-2 px-3 font-medium text-gray-700">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => (
                              <tr
                                key={item.id}
                                className="border-b border-gray-100 hover:bg-gray-50"
                              >
                                <td className="py-2 px-3 text-gray-400 text-xs font-mono w-12">
                                  {item.id}
                                </td>
                                <td className="py-2 px-3">{renderItemInfo(item)}</td>
                                <td className="py-2 px-3 text-right whitespace-nowrap">
                                  <button
                                    onClick={() => openEdit(item)}
                                    className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  {!s.noDelete && (
                                    <button
                                      onClick={() => setDeleteTarget(item.id)}
                                      className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded ml-1"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* ============ Plan custom form ============ */}
      {activeSection === 'plans' && (
        <PlanFormDialog
          open={showForm}
          onClose={() => setShowForm(false)}
          editItem={editItem}
          onSaved={() => {
            setShowForm(false);
            loadItems();
          }}
        />
      )}

      {/* ============ Gallery custom form ============ */}
      {activeSection === 'galleries' && (
        <GalleryFormDialog
          open={showForm}
          onClose={() => setShowForm(false)}
          editItem={editItem}
          onSaved={() => {
            setShowForm(false);
            loadItems();
          }}
          selectOptions={selectOptions}
        />
      )}

      {/* ============ Payment method custom form ============ */}
      {activeSection === 'payment-methods' && (
        <PaymentMethodFormDialog
          open={showForm}
          onClose={() => setShowForm(false)}
          editItem={editItem}
          svc={svc}
          onSaved={() => {
            setShowForm(false);
            loadItems();
          }}
        />
      )}

      {/* ============ Generic form dialog ============ */}
      {activeSection !== 'galleries' &&
        activeSection !== 'payment-methods' &&
        activeSection !== 'plans' &&
        section &&
        !section.customInline && (
          <Dialog
            open={showForm}
            onClose={() => setShowForm(false)}
            maxWidth="sm"
          >
            <Dialog.Header onClose={() => setShowForm(false)}>
              {editItem ? `Editar ${section.label}` : `Crear ${section.label}`}
            </Dialog.Header>
            <Dialog.Content>
              <form onSubmit={handleSubmit} className="space-y-4" id="generic-form">
                {section.fields
                  .filter((f) => !f.readOnly)
                  .map((f) => (
                    <div key={f.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {f.label} {f.required && <span className="text-red-500">*</span>}
                      </label>
                      {f.textarea ? (
                        <textarea
                          value={form[f.name] || ''}
                          onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                          rows={3}
                          required={f.required}
                        />
                      ) : f.select ? (
                        <select
                          value={form[f.name] || ''}
                          onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface text-sm"
                          required={f.required}
                        >
                          <option value="">-- Selecciona --</option>
                          {(selectOptions[f.select] || []).map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.nombre}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={f.type || 'text'}
                          step={f.decimal ? '0.01' : undefined}
                          min={f.type === 'number' ? '0' : undefined}
                          value={form[f.name] || ''}
                          onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                          required={f.required}
                        />
                      )}
                    </div>
                  ))}
              </form>
            </Dialog.Content>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="generic-form"
                disabled={saving}
                loading={saving}
              >
                {editItem ? 'Actualizar' : 'Crear'}
              </Button>
            </Dialog.Footer>
          </Dialog>
        )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar registro"
        message="Esta seguro de eliminar este registro? Esta accion no se puede deshacer."
        confirmText="Eliminar"
        type="error"
      />
    </div>
  );
};

// ============================================================
// Terms & Privacy Editor
// ============================================================
function TermsPrivacyEditor() {
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState('terms');
  const [termsData, setTermsData] = useState(null);
  const [privacyData, setPrivacyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titulo: '', numero_version: '', contenido: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const data = activeTab === 'terms' ? termsData : privacyData;
    if (data) {
      setForm({
        titulo: data.titulo || '',
        numero_version: data.numero_version?.toString() || '1',
        contenido: data.contenido || '',
      });
    } else {
      setForm({ titulo: '', numero_version: '1', contenido: '' });
    }
  }, [activeTab, termsData, privacyData]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [termsArr, privacyArr] = await Promise.all([
        adminService.getTerms(),
        adminService.getPrivacy(),
      ]);
      const tArr = Array.isArray(termsArr) ? termsArr : [];
      const pArr = Array.isArray(privacyArr) ? privacyArr : [];
      const terms = tArr.sort((a, b) => b.id - a.id)[0] || null;
      const privacy = pArr.sort((a, b) => b.id - a.id)[0] || null;
      setTermsData(terms);
      setPrivacyData(privacy);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.contenido.trim()) {
      enqueueSnackbar('Titulo y contenido son requeridos', { variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titulo: form.titulo.trim(),
        numero_version: parseInt(form.numero_version) || 1,
        contenido: form.contenido.trim(),
        es_vigente: true,
        publicado_en: new Date().toISOString(),
      };
      const data = activeTab === 'terms' ? termsData : privacyData;
      const updateFn = activeTab === 'terms' ? adminService.updateTerms : adminService.updatePrivacy;
      const createFn = activeTab === 'terms' ? adminService.createTerms : adminService.createPrivacy;

      if (data) {
        await updateFn(data.id, payload);
      } else {
        await createFn(payload);
      }
      enqueueSnackbar('Guardado correctamente', { variant: 'success' });
      await loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al guardar', {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentData = activeTab === 'terms' ? termsData : privacyData;
  const lastUpdate = currentData?.publicado_en || currentData?.fecha_hora_registro;

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-1">Terminos y Condiciones</h2>
      <p className="text-xs text-gray-500 mb-4">
        Configure los terminos que los usuarios deben aceptar al registrarse
      </p>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'terms'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Terminos de Servicio
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'privacy'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Shield className="w-4 h-4" />
          Politica de Privacidad
        </button>
      </div>

      {/* Last update */}
      {lastUpdate && (
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 mb-4">
          <span className="text-xs text-gray-500">Ultima actualizacion:</span>
          <span className="text-xs font-semibold text-primary">
            {new Date(lastUpdate).toLocaleDateString('es-PE', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Titulo</label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            placeholder={activeTab === 'terms' ? 'Terminos de Servicio' : 'Politica de Privacidad'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Version</label>
          <input
            type="text"
            value={form.numero_version}
            onChange={(e) => setForm({ ...form, numero_version: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            placeholder="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Contenido</label>
          <textarea
            value={form.contenido}
            onChange={(e) => setForm({ ...form, contenido: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            rows={10}
            placeholder="Escriba el contenido..."
          />
        </div>
      </div>

      <p className="text-xs text-gray-400 italic mt-3">
        Al guardar se actualizara la version vigente
      </p>

      <Button
        onClick={handleSave}
        disabled={saving}
        loading={saving}
        fullWidth
        className="mt-4"
        startIcon={<Save className="w-4 h-4" />}
      >
        {activeTab === 'terms' ? 'Guardar Terminos' : 'Guardar Privacidad'}
      </Button>
    </div>
  );
}

// ============================================================
// Email Templates Editor
// ============================================================
function EmailTemplatesEditor() {
  const { enqueueSnackbar } = useSnackbar();
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [sections, setSections] = useState([]);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const previewTimeoutRef = useRef(null);

  const TAB_ICONS = { store: Store, person: User };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await adminService.getEmailTemplates();
      const arr = Array.isArray(data) ? data : [];
      setTemplates(arr);
      if (arr.length > 0 && !activeTab) {
        setActiveTab(arr[0]?.variables_json?.categoria);
      }
    } catch {
      enqueueSnackbar('Error al cargar plantillas', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = templates.reduce((acc, t) => {
    const meta = t.variables_json;
    const cat = meta?.categoria;
    if (cat && !acc.find((tab) => tab.key === cat)) {
      acc.push({
        key: cat,
        label: meta?.label_tab || cat,
        icono: meta?.icono_tab || 'mail',
      });
    }
    return acc;
  }, []);

  const currentTemplate = templates.find((t) => t.variables_json?.categoria === activeTab);

  // Load sections when tab changes
  useEffect(() => {
    if (currentTemplate) {
      setAsunto(currentTemplate.asunto_plantilla || '');
      const savedSections = currentTemplate.variables_json?.sections;
      if (savedSections && Array.isArray(savedSections) && savedSections.length > 0) {
        setSections(JSON.parse(JSON.stringify(savedSections)));
      } else {
        setSections([]);
      }
      setPreviewHtml('');
      setShowPreview(false);
    }
  }, [activeTab, templates]);

  // Debounced preview
  const fetchPreview = useCallback(async (tmplName, secs) => {
    try {
      const result = await adminService.previewEmailTemplate({
        templateName: tmplName,
        sections: secs,
      });
      setPreviewHtml(result?.html || '');
    } catch {
      // Silent fail for preview
    }
  }, []);

  const triggerPreview = useCallback((secs) => {
    if (!currentTemplate) return;
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = setTimeout(() => {
      fetchPreview(currentTemplate.nombre, secs);
    }, 600);
  }, [currentTemplate, fetchPreview]);

  const updateSection = (index, newContent) => {
    setSections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], content: newContent };
      if (showPreview) triggerPreview(updated);
      return updated;
    });
  };

  const handleSave = async () => {
    if (!currentTemplate) return;
    if (!asunto.trim()) {
      enqueueSnackbar('El asunto es requerido', { variant: 'error' });
      return;
    }
    if (sections.length === 0) {
      enqueueSnackbar('No hay secciones para guardar', { variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await adminService.updateEmailTemplate(currentTemplate.id, {
        asunto_plantilla: asunto.trim(),
        sections,
      });
      enqueueSnackbar('Plantilla guardada', { variant: 'success' });
      await loadTemplates();
    } catch {
      enqueueSnackbar('Error al guardar plantilla', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setShowResetConfirm(false);
    try {
      await adminService.resetEmailTemplates();
      enqueueSnackbar('Plantillas restauradas', { variant: 'success' });
      setActiveTab(null);
      await loadTemplates();
    } catch {
      enqueueSnackbar('Error al restaurar plantillas', { variant: 'error' });
    }
  };

  const handleTogglePreview = () => {
    if (!showPreview && currentTemplate) {
      fetchPreview(currentTemplate.nombre, sections);
    }
    setShowPreview((v) => !v);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  const variables = currentTemplate?.variables_json?.variables || [];
  const descripcion = currentTemplate?.variables_json?.descripcion || '';
  const titulo = currentTemplate?.variables_json?.titulo_display || '';

  const VAR_TOOLTIPS = {
    nombre: 'Nombre del usuario',
    codigo: 'Código de verificación completo',
    d1: 'Dígito 1 del código', d2: 'Dígito 2 del código', d3: 'Dígito 3 del código',
    d4: 'Dígito 4 del código', d5: 'Dígito 5 del código', d6: 'Dígito 6 del código',
    minutos: 'Minutos antes de que expire',
    link: 'Enlace para restablecer contraseña',
    horas: 'Horas antes de que expire',
    tienda: 'Nombre de la tienda',
    fecha_vencimiento: 'Fecha en que vence la suscripción',
    storeName: 'Nombre de la tienda',
    sellerName: 'Nombre del vendedor',
  };

  // Section type labels for fixed sections
  const FIXED_LABELS = {
    greeting: 'Saludo automático',
    digitRow: 'Código de verificación (6 dígitos)',
    warningBox: 'Alerta de tienda y fecha',
    successBox: 'Confirmación',
  };

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-1">Plantillas de Email</h2>
      <p className="text-xs text-gray-500 mb-4">
        Edita el contenido de los correos que se envían automáticamente
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((tab) => {
          const TabIcon = TAB_ICONS[tab.icono] || Mail;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {currentTemplate && (
        <>
          {/* Info card */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl mb-4">
            <h3 className="text-sm font-bold text-amber-700">{titulo}</h3>
            <p className="text-xs text-amber-600 mt-1">{descripcion}</p>
          </div>

          {/* Variables reference */}
          {variables.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-1.5">Variables disponibles:</p>
              <div className="flex flex-wrap gap-1.5">
                {variables.filter((v) => !['logo_url', 'logo_display'].includes(v)).map((v) => (
                  <span
                    key={v}
                    className="relative group px-2 py-1 rounded-full border border-gray-300 bg-white text-xs font-mono text-gray-600 cursor-help"
                  >
                    {`{{${v}}}`}
                    {VAR_TOOLTIPS[v] && (
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-gray-800 text-white text-[11px] font-sans whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                        {VAR_TOOLTIPS[v]}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                      </span>
                    )}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 italic mt-1.5">
                Escribe estas variables en los campos editables. Se reemplazarán automáticamente al enviar el correo.
              </p>
            </div>
          )}

          {/* Subject */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Asunto del correo
            </label>
            <input
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
          </div>

          {/* Sections editor */}
          <div className="space-y-3 mb-4">
            <p className="text-sm font-medium text-gray-700">Secciones del correo</p>
            {sections.map((section, idx) => (
              <div key={section.key} className={`rounded-xl border ${section.editable ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'} overflow-hidden`}>
                {/* Section header */}
                <div className={`flex items-center gap-2 px-3 py-2 ${section.editable ? 'bg-primary/5 border-b border-gray-200' : 'bg-gray-100 border-b border-gray-200'}`}>
                  {section.editable ? (
                    <Type className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  <span className={`text-xs font-semibold ${section.editable ? 'text-primary' : 'text-gray-500'}`}>
                    {section.label}
                  </span>
                  {!section.editable && (
                    <span className="ml-auto text-xs text-gray-400 italic">
                      Sección fija
                    </span>
                  )}
                </div>

                {/* Section body */}
                <div className="px-3 py-2">
                  {section.editable ? (
                    section.type === 'ctaButton' ? (
                      <input
                        type="text"
                        value={section.content}
                        onChange={(e) => updateSection(idx, e.target.value)}
                        placeholder="Texto del botón..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                      />
                    ) : (
                      <textarea
                        value={section.content}
                        onChange={(e) => updateSection(idx, e.target.value)}
                        rows={section.type === 'infoBox' ? 2 : 3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                      />
                    )
                  ) : (
                    <p className="text-xs text-gray-500 italic py-1">
                      {FIXED_LABELS[section.type] || section.content || 'Contenido generado automáticamente'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Preview toggle */}
          <button
            onClick={handleTogglePreview}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 mb-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Ocultar vista previa' : 'Ver vista previa'}
          </button>

          {/* Preview iframe */}
          {showPreview && (
            <div className="mb-4 rounded-xl border border-gray-300 overflow-hidden">
              <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600">Vista previa (datos de ejemplo)</p>
              </div>
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  title="Vista previa del email"
                  className="w-full border-0"
                  style={{ height: '500px' }}
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex justify-center py-8">
                  <Spinner size="md" />
                </div>
              )}
            </div>
          )}

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            loading={saving}
            fullWidth
            className="mt-2"
            startIcon={<Save className="w-4 h-4" />}
          >
            Guardar Plantilla
          </Button>

          {/* Reset button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center justify-center gap-2 text-sm text-primary font-semibold mt-3 hover:text-primary-dark transition-colors py-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar Predeterminados
          </button>

          <ConfirmDialog
            open={showResetConfirm}
            onClose={() => setShowResetConfirm(false)}
            onConfirm={handleReset}
            title="Restaurar plantillas"
            message="Se restaurarán las plantillas a sus valores predeterminados. Los cambios que hayas hecho se perderán."
            confirmText="Restaurar"
            type="warning"
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// Payment Method Form Dialog
// ============================================================
function PaymentMethodFormDialog({ open, onClose, editItem, svc, onSaved }) {
  const { enqueueSnackbar } = useSnackbar();
  const [tipo, setTipo] = useState('');
  const [titular, setTitular] = useState('');
  const [nombreBanco, setNombreBanco] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [cci, setCci] = useState('');
  const [numeroCelular, setNumeroCelular] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTipo(editItem?.tipo || '');
      setTitular(editItem?.titular || '');
      setNombreBanco(editItem?.nombre_banco || '');
      setNumeroCuenta(editItem?.numero_cuenta || '');
      setCci(editItem?.cci || '');
      setNumeroCelular(editItem?.numero_celular || '');
    }
  }, [open, editItem]);

  const isBilletera = tipo === 'YAPE' || tipo === 'PLIN';
  const isBanco = tipo === 'BANCO';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!svc) return;
    setSaving(true);
    try {
      const payload = { tipo, titular };
      if (isBanco) {
        payload.nombre_banco = nombreBanco;
        payload.numero_cuenta = numeroCuenta;
        payload.cci = cci;
        payload.numero_celular = null;
      } else {
        payload.numero_celular = numeroCelular;
        payload.nombre_banco = null;
        payload.numero_cuenta = null;
        payload.cci = null;
      }

      if (editItem) {
        await svc.update(editItem.id, payload);
        enqueueSnackbar('Actualizado correctamente', { variant: 'success' });
      } else {
        await svc.create(payload);
        enqueueSnackbar('Creado correctamente', { variant: 'success' });
      }
      onSaved();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm">
      <Dialog.Header onClose={onClose}>
        {editItem ? 'Editar Metodo de Pago' : 'Nuevo Metodo de Pago'}
      </Dialog.Header>
      <Dialog.Content>
        <form onSubmit={handleSubmit} id="payment-form" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tipo de metodo <span className="text-red-500">*</span>
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface text-sm"
              required
            >
              <option value="">-- Selecciona --</option>
              <option value="YAPE">Yape</option>
              <option value="PLIN">Plin</option>
              <option value="BANCO">Cuenta Bancaria</option>
            </select>
          </div>

          {(isBilletera || isBanco) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Titular <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={titular}
                  onChange={(e) => setTitular(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="Nombre del titular"
                  required
                />
              </div>

              {isBilletera && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Numero de celular <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={numeroCelular}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setNumeroCelular(val);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="9 digitos"
                    maxLength={9}
                    pattern="\d{9}"
                    title="Ingresa exactamente 9 digitos"
                    required
                  />
                </div>
              )}

              {isBanco && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nombre del banco <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nombreBanco}
                      onChange={(e) => setNombreBanco(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                      placeholder="Ej: BCP, Interbank, BBVA"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Numero de cuenta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={numeroCuenta}
                      onChange={(e) => setNumeroCuenta(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                      placeholder="Numero de cuenta principal"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Cuenta Interbancaria (CCI) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cci}
                      onChange={(e) => setCci(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                      placeholder="Numero de cuenta interbancaria"
                      required
                    />
                  </div>
                </>
              )}
            </>
          )}
        </form>
      </Dialog.Content>
      <Dialog.Footer>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form="payment-form"
          disabled={saving || !tipo}
          loading={saving}
        >
          {editItem ? 'Actualizar' : 'Crear'}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}

// ============================================================
// Gallery Form Dialog (with map, photos, city/zone selectors)
// ============================================================
function GalleryFormDialog({ open, onClose, editItem, onSaved, selectOptions }) {
  const { enqueueSnackbar } = useSnackbar();

  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [filteredZones, setFilteredZones] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  const [galleryForm, setGalleryForm] = useState({
    nombre: '',
    direccion: '',
    descripcion: '',
    id_ciudad: '',
    id_zona: '',
    latitud: null,
    longitud: null,
    images: [],
  });

  // Load cities and zones when dialog opens
  useEffect(() => {
    if (open) {
      loadCitiesAndZones();
      if (editItem) {
        setGalleryForm({
          nombre: editItem.nombre || '',
          direccion: editItem.direccion || '',
          descripcion: editItem.descripcion || '',
          id_ciudad: editItem.id_ciudad?.toString() || editItem.tbl_zonas?.id_ciudad?.toString() || '',
          id_zona: editItem.id_zona?.toString() || '',
          latitud: editItem.latitud ? parseFloat(editItem.latitud) : null,
          longitud: editItem.longitud ? parseFloat(editItem.longitud) : null,
          images: Array.isArray(editItem.fotos)
            ? editItem.fotos.map((f) => (typeof f === 'string' ? f : f.url_foto || f.url || ''))
            : [],
        });
      } else {
        setGalleryForm({
          nombre: '',
          direccion: '',
          descripcion: '',
          id_ciudad: '',
          id_zona: '',
          latitud: null,
          longitud: null,
          images: [],
        });
      }
    }
  }, [open, editItem]);

  const loadCitiesAndZones = async () => {
    setLoadingCities(true);
    try {
      const [citiesData, zonesData] = await Promise.all([
        adminService.getCities(),
        adminService.getZones(),
      ]);
      setCities(Array.isArray(citiesData) ? citiesData : []);
      setZones(Array.isArray(zonesData) ? zonesData : []);
    } catch {
      // ignore
    } finally {
      setLoadingCities(false);
    }
  };

  // Filter zones when city changes
  useEffect(() => {
    if (galleryForm.id_ciudad) {
      const cId = parseInt(galleryForm.id_ciudad);
      setFilteredZones(zones.filter((z) => parseInt(z.id_ciudad) === cId));
    } else {
      setFilteredZones([]);
    }
  }, [galleryForm.id_ciudad, zones]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      enqueueSnackbar('Tu navegador no soporta geolocalizacion', { variant: 'error' });
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGalleryForm((prev) => ({
          ...prev,
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
        }));
        enqueueSnackbar('Ubicacion obtenida correctamente', { variant: 'success' });
        setLoadingLocation(false);
      },
      () => {
        enqueueSnackbar('No se pudo obtener la ubicacion', { variant: 'error' });
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + galleryForm.images.length > 5) {
      enqueueSnackbar('Maximo 5 imagenes permitidas', { variant: 'warning' });
      return;
    }
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setGalleryForm((prev) => ({
          ...prev,
          images: [...prev.images, event.target.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setGalleryForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!galleryForm.nombre.trim()) {
      enqueueSnackbar('El nombre es requerido', { variant: 'error' });
      return;
    }
    if (!galleryForm.id_zona) {
      enqueueSnackbar('Debe seleccionar una zona', { variant: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: galleryForm.nombre.trim(),
        direccion: galleryForm.direccion || '',
        descripcion: galleryForm.descripcion || '',
        id_ciudad: parseInt(galleryForm.id_ciudad),
        id_zona: parseInt(galleryForm.id_zona),
        latitud: galleryForm.latitud || null,
        longitud: galleryForm.longitud || null,
      };

      let galleryId;
      if (editItem) {
        await adminService.updateGallery(editItem.id, payload);
        galleryId = editItem.id;
        enqueueSnackbar('Galeria actualizada', { variant: 'success' });
      } else {
        const result = await adminService.createGallery(payload);
        galleryId = result?.id || result?.data?.id;
        enqueueSnackbar('Galeria creada', { variant: 'success' });
      }

      // Upload new base64 images
      if (galleryId && Array.isArray(galleryForm.images)) {
        const base64Images = galleryForm.images.filter(
          (img) => typeof img === 'string' && img.startsWith('data:')
        );
        if (base64Images.length > 0) {
          const formData = new FormData();
          for (let i = 0; i < base64Images.length; i++) {
            const blob = await fetch(base64Images[i]).then((r) => r.blob());
            formData.append('fotos', blob, `image-${i}.jpg`);
          }
          await api.post(`/admin/galleries/${galleryId}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      onSaved();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.error || err.message || 'Error al guardar', {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg">
      <Dialog.Header onClose={onClose}>
        {editItem ? 'Editar Galeria' : 'Nueva Galeria'}
      </Dialog.Header>
      <Dialog.Content>
        <form onSubmit={handleSubmit} id="gallery-form" className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={galleryForm.nombre}
              onChange={(e) => setGalleryForm({ ...galleryForm, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              placeholder="Ej: Centro Comercial Real Plaza"
              required
            />
          </div>

          {/* City selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ciudad <span className="text-red-500">*</span>
            </label>
            <select
              value={galleryForm.id_ciudad}
              onChange={(e) =>
                setGalleryForm({ ...galleryForm, id_ciudad: e.target.value, id_zona: '' })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface text-sm"
              disabled={loadingCities}
            >
              <option value="">-- Selecciona una ciudad --</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Zone selector (filtered by city) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Zona Comercial <span className="text-red-500">*</span>
            </label>
            <select
              value={galleryForm.id_zona}
              onChange={(e) => setGalleryForm({ ...galleryForm, id_zona: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface text-sm"
              disabled={!galleryForm.id_ciudad || filteredZones.length === 0}
              required
            >
              <option value="">-- Selecciona una zona --</option>
              {filteredZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.nombre}
                </option>
              ))}
            </select>
            {galleryForm.id_ciudad && filteredZones.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No hay zonas disponibles para esta ciudad. Crea una zona primero.
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Direccion</label>
            <input
              type="text"
              value={galleryForm.direccion}
              onChange={(e) => setGalleryForm({ ...galleryForm, direccion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              placeholder="Av. Principal 123"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripcion</label>
            <textarea
              rows={2}
              value={galleryForm.descripcion}
              onChange={(e) => setGalleryForm({ ...galleryForm, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              placeholder="Breve descripcion de la galeria"
            />
          </div>

          {/* Map + GPS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-primary" />
                Ubicacion en el Mapa
              </div>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Haz clic en el mapa para seleccionar la ubicacion de la galeria, o usa el boton para
              obtener tu ubicacion actual.
            </p>

            <div className="rounded-lg overflow-hidden border border-gray-300 mb-3">
              <MapContainer
                key={`gallery-map-${open}-${editItem?.id || 'new'}`}
                center={[
                  galleryForm.latitud || -12.0464,
                  galleryForm.longitud || -77.0428,
                ]}
                zoom={galleryForm.latitud && galleryForm.longitud ? 16 : 12}
                style={{ height: 250, width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker
                  position={
                    galleryForm.latitud && galleryForm.longitud
                      ? [galleryForm.latitud, galleryForm.longitud]
                      : null
                  }
                  onLocationSelect={(lat, lng) => {
                    setGalleryForm({ ...galleryForm, latitud: lat, longitud: lng });
                  }}
                />
                {galleryForm.latitud && galleryForm.longitud && (
                  <MapCenter center={[galleryForm.latitud, galleryForm.longitud]} />
                )}
              </MapContainer>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Latitud</label>
                <input
                  type="number"
                  step="any"
                  value={galleryForm.latitud || ''}
                  onChange={(e) =>
                    setGalleryForm({
                      ...galleryForm,
                      latitud: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="-12.0464"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Longitud</label>
                <input
                  type="number"
                  step="any"
                  value={galleryForm.longitud || ''}
                  onChange={(e) =>
                    setGalleryForm({
                      ...galleryForm,
                      longitud: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="-77.0428"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={loadingLocation}
              startIcon={
                loadingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )
              }
            >
              {loadingLocation ? 'Obteniendo...' : 'Usar mi ubicacion actual'}
            </Button>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fotos de la galeria (opcional, max. 5)
            </label>

            {galleryForm.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {galleryForm.images.map((img, index) => (
                  <div key={index} className="relative w-20 h-20">
                    <img
                      src={img}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                <Image className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Galeria</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                <Camera className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Camara</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </form>
      </Dialog.Content>
      <Dialog.Footer>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form="gallery-form"
          disabled={saving}
          loading={saving}
        >
          {editItem ? 'Actualizar' : 'Crear'}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}

export default ConfigPage;
