/**
 * FilterChips - Grupo de chips para filtrar
 * @param {Array} filters - Array de objetos { key, label, count? }
 * @param {string} activeFilter - Key del filtro activo
 * @param {function} onChange - Callback cuando cambia el filtro
 */
const FilterChips = ({
  filters = [],
  activeFilter,
  onChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.key;

        return (
          <button
            key={filter.key}
            onClick={() => onChange(filter.key)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium
              transition-all duration-200 hover:scale-[1.02]
              ${isActive
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }
            `}
          >
            {filter.count !== undefined
              ? `${filter.label} (${filter.count})`
              : filter.label
            }
          </button>
        );
      })}
    </div>
  );
};

export default FilterChips;
