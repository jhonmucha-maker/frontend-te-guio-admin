import StatsCard from '../../common/StatsCard';

/**
 * StatsHeader - Header con multiples tarjetas de estadisticas
 * @param {Array} stats - Array de objetos { label, value, color, icon, onClick }
 */
const StatsHeader = ({ stats = [] }) => {
  return (
    <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
      {stats.map((stat, index) => (
        <StatsCard
          key={stat.key || index}
          label={stat.label}
          value={stat.value}
          color={stat.color}
          icon={stat.icon}
          onClick={stat.onClick}
        />
      ))}
    </div>
  );
};

export default StatsHeader;
