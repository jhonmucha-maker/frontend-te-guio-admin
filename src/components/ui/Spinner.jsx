const sizes = {
  xs: 'w-4 h-4 border-2',
  sm: 'w-5 h-5 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-12 h-12 border-4',
};

const Spinner = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const colorClasses = {
    primary: 'border-gray-300 border-t-primary',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-200 border-t-gray-500',
  };

  return (
    <div
      className={`
        animate-spin rounded-full
        ${sizes[size]}
        ${colorClasses[color]}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;
