import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import { useSnackbar } from 'notistack';
import Button from './Button';
import { downloadExport } from '../../utils/exportDownload';

// Boton reutilizable de exportacion con menu Excel / PDF (panel web).
//
// Props:
//  - exportFn(format): funcion que hace la peticion al backend y devuelve la
//    respuesta axios (responseType: 'blob'). format es 'xlsx' | 'pdf'.
//  - baseName: nombre del archivo sin extension (ej: 'compradores').
//  - label: texto del boton (default 'Exportar').
//  - size: tamano del boton ('sm' | 'md' | 'lg').
export default function ExportButton({ exportFn, baseName, label = 'Exportar', size = 'sm' }) {
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const run = async (format) => {
    setOpen(false);
    setBusy(true);
    try {
      const res = await exportFn(format);
      downloadExport(res.data, baseName, format);
      enqueueSnackbar('Archivo descargado', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al exportar', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="primary"
        size={size}
        startIcon={<Download size={16} />}
        endIcon={<ChevronDown size={14} />}
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
      >
        {busy ? 'Exportando...' : label}
      </Button>

      {open && !busy && (
        <div className="absolute right-0 mt-1 w-44 bg-surface rounded-lg shadow-lg border border-gray-200 z-30 overflow-hidden">
          <button
            type="button"
            onClick={() => run('xlsx')}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <FileSpreadsheet size={16} className="text-green-600" />
            Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => run('pdf')}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors border-t border-gray-100"
          >
            <FileText size={16} className="text-red-600" />
            PDF
          </button>
        </div>
      )}
    </div>
  );
}
