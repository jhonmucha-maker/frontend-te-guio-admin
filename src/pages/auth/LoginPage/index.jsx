import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import { APP_NAME } from '../../../utils/constants';
import { Alert } from '../../../components/ui';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  // Redirigir si ya esta autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Limpiar errores al montar
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validaciones basicas
    if (!email.trim()) {
      setFormError('Ingrese su correo electronico');
      return;
    }

    if (!password) {
      setFormError('Ingrese su contraseña');
      return;
    }

    const result = await login(email.trim(), password);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #312c85 0%, #4a44a8 50%, #312c85 100%)',
      }}
    >
      {/* Circulos decorativos */}
      <div
        className="absolute rounded-full"
        style={{
          width: '400px',
          height: '400px',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          top: '-150px',
          right: '-100px',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '300px',
          height: '300px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          top: '50%',
          right: '10%',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '350px',
          height: '350px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          bottom: '-100px',
          left: '-80px',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '200px',
          height: '200px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          top: '20%',
          left: '5%',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '150px',
          height: '150px',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          bottom: '15%',
          right: '20%',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '100px',
          height: '100px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          top: '60%',
          left: '15%',
        }}
      />

      {/* Card del login */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div
          className="bg-surface rounded-3xl p-8 md:p-10 shadow-2xl"
          style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 mb-4">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-primary">
              {APP_NAME}
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Panel de Administracion
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Alerta de error */}
            {(error || formError) && (
              <Alert variant="error">
                {formError || error}
              </Alert>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Correo electronico
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="admin@ejemplo.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Boton de login */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #312c85 0%, #4a44a8 100%)',
              }}
            >
              {loading ? (
                <span>Iniciando sesion...</span>
              ) : (
                <>
                  <span>Iniciar Sesion</span>
                  <LogIn size={20} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center mt-8 text-xs text-neutral-400">
            Solo para usuarios administradores
          </p>
        </div>

        {/* Copyright */}
        <p className="text-center mt-6 text-sm text-white/60">
          © 2024 {APP_NAME}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
