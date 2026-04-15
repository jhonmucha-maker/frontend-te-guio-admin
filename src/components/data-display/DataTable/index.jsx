import { useState } from 'react';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '../../../hooks/useMediaQuery';
import { Skeleton } from '../../ui';
import EmptyState from '../EmptyState';

/**
 * DataTable - Tabla de datos responsive
 * @param {Array} columns - Columnas { id, label, minWidth?, align?, render?, hideOnMobile? }
 * @param {Array} rows - Datos a mostrar
 * @param {function} onRowClick - Callback al hacer click en una fila
 * @param {boolean} loading - Si esta cargando
 * @param {string} emptyMessage - Mensaje cuando no hay datos
 * @param {boolean} pagination - Si muestra paginacion
 * @param {number} rowsPerPageDefault - Filas por pagina por defecto
 * @param {function} renderMobileCard - Render personalizado para mobile
 * @param {function} getRowActions - Funcion que retorna acciones para cada fila
 */
const DataTable = ({
  columns = [],
  rows = [],
  onRowClick,
  loading = false,
  emptyMessage = 'No hay datos para mostrar',
  pagination = true,
  rowsPerPageDefault = 10,
  renderMobileCard,
  getRowActions,
  rowKey = 'id',
}) => {
  const isMobile = useIsMobile();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageDefault);

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (value) => {
    setRowsPerPage(parseInt(value, 10));
    setPage(0);
  };

  // Datos paginados
  const paginatedRows = pagination
    ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : rows;

  const totalPages = Math.ceil(rows.length / rowsPerPage);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  // Empty state
  if (rows.length === 0) {
    return <EmptyState type="empty" message={emptyMessage} />;
  }

  // Vista movil - Cards
  if (isMobile) {
    return (
      <div>
        {paginatedRows.map((row, index) => (
          <div
            key={row[rowKey] || index}
            onClick={() => onRowClick && onRowClick(row)}
            className={`
              bg-surface rounded-lg shadow-card border border-gray-200 p-4 mb-3
              ${onRowClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}
            `}
          >
            {renderMobileCard ? (
              renderMobileCard(row)
            ) : (
              <div>
                {columns
                  .filter((col) => !col.hideOnMobile)
                  .map((column) => (
                    <div
                      key={column.id}
                      className="flex justify-between py-1 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="text-sm text-gray-500 font-medium">
                        {column.label}:
                      </span>
                      <span className="text-sm text-gray-900">
                        {column.render
                          ? column.render(row[column.id], row)
                          : row[column.id]}
                      </span>
                    </div>
                  ))}
                {getRowActions && (
                  <div className="flex justify-end mt-2 gap-2">
                    {getRowActions(row)}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {pagination && rows.length > rowsPerPage && (
          <Pagination
            page={page}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalRows={rows.length}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </div>
    );
  }

  // Vista desktop - Tabla
  return (
    <div className="bg-surface rounded-lg shadow-card border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`
                    px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                  `}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </th>
              ))}
              {(onRowClick || getRowActions) && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedRows.map((row, index) => (
              <tr
                key={row[rowKey] || index}
                className={`
                  hover:bg-gray-50 transition-colors
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`
                      px-4 py-3 text-sm text-gray-900
                      ${column.align === 'center' ? 'text-center' : ''}
                      ${column.align === 'right' ? 'text-right' : ''}
                    `}
                  >
                    {column.render
                      ? column.render(row[column.id], row)
                      : row[column.id]}
                  </td>
                ))}
                {(onRowClick || getRowActions) && (
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      {onRowClick && (
                        <button
                          onClick={() => onRowClick(row)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      {getRowActions && getRowActions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && rows.length > rowsPerPage && (
        <Pagination
          page={page}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalRows={rows.length}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </div>
  );
};

// Componente de paginacion
const Pagination = ({ page, totalPages, rowsPerPage, totalRows, onPageChange, onRowsPerPageChange }) => {
  const from = page * rowsPerPage + 1;
  const to = Math.min((page + 1) * rowsPerPage, totalRows);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Filas por pagina:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {[5, 10, 25, 50].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {from}-{to} de {totalRows}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
