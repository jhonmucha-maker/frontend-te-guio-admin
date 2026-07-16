// Exportacion general: un unico punto para descargar varias entidades a la vez.
// El catalogo de entidades lo define el backend (utils/datasets), no esta
// duplicado aqui: si se agrega una entidad alla, aparece sola en esta lista.
//
// Siempre se descarga UN solo archivo:
//   Excel -> una hoja por entidad
//   PDF   -> una seccion por entidad
// Los botones de exportar de cada modulo siguen existiendo; esto los complementa.

import { useState, useEffect, useCallback } from 'react';
import {
  Download, FileSpreadsheet, FileText, RefreshCw, AlertTriangle, Check,
} from 'lucide-react';
import { useSnackbar } from 'notistack';

import adminService from '../../../services/adminService';
import { downloadExport } from '../../../utils/exportDownload';
import { Button, Spinner } from '../../../components/ui';

// Entidades cuyo volumen puede hacer pesada la exportacion: se avisa al usuario
// antes de que espere un archivo instantaneo.
const HEAVY = new Set(['products', 'sellers']);

const FORMATS = [
  { key: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet, iconClass: 'text-green-600',
    hint: 'Una hoja por entidad' },
  { key: 'pdf', label: 'PDF', icon: FileText, iconClass: 'text-red-600',
    hint: 'Una sección por entidad' },
];

const ExportsPage = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [format, setFormat] = useState('xlsx');
  const [busy, setBusy] = useState(false);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getExportCatalog();
      const entidades = data?.entidades || [];
      setCatalog(entidades);
      // Por defecto todo marcado: el caso comun es "quiero todo".
      setSelected(entidades.map((e) => e.key));
    } catch {
      enqueueSnackbar('Error al cargar el catálogo de exportación', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  const toggle = (key) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const allSelected = catalog.length > 0 && selected.length === catalog.length;
  const toggleAll = () => setSelected(allSelected ? [] : catalog.map((e) => e.key));

  const handleExport = async () => {
    if (!selected.length) return;
    setBusy(true);
    try {
      // El backend respeta el orden del registro, no el de esta lista.
      const res = await adminService.exportBundle(selected, format);
      downloadExport(res.data, 'marketplace', format);
      enqueueSnackbar('Archivo descargado', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al exportar', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const heavySelected = selected.filter((k) => HEAVY.has(k));

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Exportación general</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Descarga varias entidades en un solo archivo.
          </p>
        </div>
        <button
          onClick={loadCatalog}
          disabled={busy}
          className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Formato */}
      <div className="bg-surface rounded-lg shadow-card border border-gray-200 p-4 mb-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
          Formato
        </h2>
        <div className="inline-flex bg-gray-100 p-1 rounded-lg gap-1">
          {FORMATS.map(({ key, label, icon: Icon, iconClass }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormat(key)}
              aria-pressed={format === key}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                format === key
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon size={16} className={iconClass} />
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {FORMATS.find((f) => f.key === format)?.hint}
        </p>
      </div>

      {/* Entidades */}
      <div className="bg-surface rounded-lg shadow-card border border-gray-200 p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Qué exportar
          </h2>
          <button
            type="button"
            onClick={toggleAll}
            className="text-sm font-semibold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
          >
            {allSelected ? 'Quitar selección' : 'Seleccionar todo'}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-2">
          {catalog.map(({ key, label }) => {
            const on = selected.includes(key);
            return (
              <label
                key={key}
                className={`flex items-center gap-3 p-3 rounded-lg border-[1.5px] cursor-pointer transition-colors ${
                  on ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-primary-light'
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(key)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`w-4 h-4 rounded flex-shrink-0 grid place-items-center border-2 transition-colors ${
                    on ? 'bg-primary border-primary' : 'border-gray-400'
                  }`}
                >
                  {on && <Check size={11} className="text-white" strokeWidth={3.5} />}
                </span>
                <span className="text-sm font-semibold text-gray-800">{label}</span>
                {HEAVY.has(key) && (
                  <span className="ml-auto text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    PESADO
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Aviso de volumen: el export no pagina, conviene decirlo antes. */}
      {heavySelected.length > 0 && (
        <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            La exportación incluye todos los registros, sin filtros ni límite. Con muchos
            datos puede tardar{format === 'pdf' ? ' bastante: el PDF es el formato más lento.' : '.'}
          </p>
        </div>
      )}

      {/* Accion */}
      <div className="flex justify-between items-center bg-surface rounded-lg shadow-card border border-gray-200 p-4">
        <span className="text-sm text-gray-600">
          <b className="text-gray-900 font-bold">
            {selected.length} de {catalog.length}
          </b>{' '}
          seleccionadas
        </span>
        <Button
          variant="primary"
          startIcon={busy ? null : <Download size={16} />}
          loading={busy}
          disabled={busy || selected.length === 0}
          onClick={handleExport}
        >
          {busy ? 'Generando...' : 'Exportar'}
        </Button>
      </div>
    </div>
  );
};

export default ExportsPage;
