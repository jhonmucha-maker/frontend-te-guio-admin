/**
 * StatsCard - Tarjeta de estadistica individual
 * @param {string} label - Texto descriptivo
 * @param {number|string} value - Valor a mostrar
 * @param {string} color - Color del tema (primary, success, error, warning, info)
 * @param {React.ReactNode} icon - Icono opcional
 * @param {function} onClick - Funcion opcional al hacer click
 */
const StatsCard = ({ label, value, color = 'primary', icon, onClick }) => {
  const colorClasses = {
    primary: 'from-indigo-900 to-indigo-700',
    success: 'from-green-600 to-green-500',
    error: 'from-red-600 to-red-500',
    warning: 'from-amber-600 to-amber-500',
    info: 'from-blue-600 to-blue-500',
    secondary: 'from-gray-600 to-gray-500',
    premium: 'from-amber-500 to-yellow-400',
  };

  const bgGradient = colorClasses[color] || colorClasses.primary;

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg bg-gradient-to-br ${bgGradient} text-white
        min-w-[140px] flex-1
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : ''}
        transition-all duration-200
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl sm:text-3xl font-bold leading-none mb-1">
            {value}
          </p>
          <p className="text-xs sm:text-sm font-medium opacity-90">
            {label}
          </p>
        </div>
        {icon && (
          <div className="opacity-80 text-2xl">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
