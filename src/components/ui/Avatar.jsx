const sizes = {
  xs: 'w-6 h-6 text-2xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

// Generate a consistent color from string - usando colores del APK
const stringToColor = (str) => {
  if (!str) return 'bg-primary';

  const colors = [
    'bg-primary',       // #312c85 - Azul/morado
    'bg-primary-light', // #4a44a8
    'bg-secondary',     // #FF6B6B - Rojo coral
    'bg-accent',        // #4ECDC4 - Turquesa
    'bg-accent-dark',   // #3AB5AD
    'bg-success',       // #4CAF50 - Verde
    'bg-success-dark',  // #388E3C
    'bg-warning',       // #FF9800 - Naranja
    'bg-warning-dark',  // #F57C00
    'bg-info',          // #2196F3 - Azul
    'bg-info-dark',     // #1976D2
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

// Get initials from name
const getInitials = (name) => {
  if (!name) return '?';

  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
  className = '',
  ...props
}) => {
  const initials = getInitials(name || alt);
  const bgColor = stringToColor(name || alt);

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={`
          inline-block rounded-full object-cover
          ${sizes[size]}
          ${className}
        `}
        {...props}
      />
    );
  }

  return (
    <div
      className={`
        inline-flex items-center justify-center rounded-full text-white font-semibold
        ${sizes[size]}
        ${bgColor}
        ${className}
      `}
      title={name || alt}
      {...props}
    >
      {initials}
    </div>
  );
};

export { getInitials, stringToColor };
export default Avatar;
