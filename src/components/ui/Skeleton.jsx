const Skeleton = ({
  width,
  height,
  circle = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`
        bg-gray-200 animate-pulse
        ${circle ? 'rounded-full' : 'rounded'}
        ${className}
      `}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
      {...props}
    />
  );
};

// Skeleton variants
Skeleton.Text = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height="1rem"
        width={i === lines - 1 && lines > 1 ? '75%' : '100%'}
      />
    ))}
  </div>
);

Skeleton.Avatar = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 32, md: 40, lg: 48, xl: 64 };
  return (
    <Skeleton
      circle
      width={sizes[size]}
      height={sizes[size]}
      className={className}
    />
  );
};

Skeleton.Card = ({ className = '' }) => (
  <div className={`bg-surface rounded-card border border-gray-200 p-4 ${className}`}>
    <Skeleton height="120px" className="mb-4" />
    <Skeleton height="1rem" className="mb-2" />
    <Skeleton height="1rem" width="60%" />
  </div>
);

Skeleton.Table = ({ rows = 5, cols = 4, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    <div className="flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} height="2.5rem" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} height="3rem" />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;
