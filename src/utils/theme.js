// Colores del APK - Basados en DesignTokens.json
export const colors = {
  primary: {
    main: '#312c85',        // Azul/morado oscuro del APK
    light: '#4a44a8',
    dark: '#1f1b5c',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#FF6B6B',        // Rojo coral del APK
    light: '#FF8888',
    dark: '#E64545',
    contrastText: '#ffffff',
  },
  accent: {
    main: '#4ECDC4',        // Turquesa del APK
    light: '#6FE0D8',
    dark: '#3AB5AD',
    contrastText: '#ffffff',
  },
  success: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C',
    contrastText: '#ffffff',
  },
  error: {
    main: '#F44336',
    light: '#E57373',
    dark: '#D32F2F',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#FF9800',
    light: '#FFB74D',
    dark: '#F57C00',
    contrastText: '#000000',
  },
  info: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
    contrastText: '#ffffff',
  },
  background: {
    default: '#F5F5F5',     // backgroundSecondary del APK
    paper: '#ffffff',
  },
  text: {
    primary: '#212121',     // text del APK
    secondary: '#757575',   // textSecondary del APK
    disabled: '#9E9E9E',    // textTertiary del APK
  },
  border: {
    main: '#E0E0E0',
    light: '#F5F5F5',
    dark: '#BDBDBD',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

// Colores de estado - basados en el APK
export const statusColors = {
  pending: '#FF9800',       // warning del APK
  approved: '#4CAF50',      // success del APK
  rejected: '#F44336',      // danger del APK
  active: '#4CAF50',        // success del APK
  inactive: '#9E9E9E',      // neutral500 del APK
  premium: '#312c85',       // primary del APK
  expiring: '#F57C00',      // warningDark del APK
};

// Colores de alertas del APK
export const alertColors = {
  pending: {
    background: '#FFF3E0',
    text: '#E65100',
  },
  error: {
    background: '#FFEBEE',
    text: '#C62828',
  },
  success: {
    background: '#E8F5E9',
    text: '#2E7D32',
  },
  warning: {
    background: '#FFFBEB',
    text: '#92400E',
  },
};

export default { colors, statusColors, alertColors };
