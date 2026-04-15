import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import authService from '../../../services/authService';
import { Button, Input, Alert, Spinner } from '../../../components/ui';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Validar que existe el token al montar
  useEffect(() => {
    if (!token) {
      setError('Token de recuperación no válido o faltante');
      setValidatingToken(false);
      setTokenValid(false);
    } else {
      // Token presente, consideramos válido hasta que el submit diga lo contrario
      setValidatingToken(false);
      setTokenValid(true);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones básicas
    if (!newPassword) {
      setError('Ingrese su nueva contraseña');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.resetPassword(token, newPassword);

      if (result.success) {
        setSuccess(true);
        setError('');
        // No redirigimos - el usuario debe volver a la app móvil
      } else {
        setError(result.message || 'Error al restablecer la contraseña');
      }
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña. El token puede estar expirado.');
      setTokenValid(false);
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de carga inicial
  if (validatingToken) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-gray-100 p-4">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Validando enlace de recuperación...</p>
      </div>
    );
  }

  // Pantalla de éxito
  if (success) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-[#312c85] to-[#4a45a8] p-4 sm:p-6">
        <div className="card max-w-md w-full overflow-visible">
          <div className="p-6 sm:p-8 text-center">
            {/* Icono de éxito */}
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-14 h-14 text-green-600" />
              </div>
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Felicidades!
            </h1>

            {/* Mensaje */}
            <p className="text-gray-600 mb-6">
              Tu contraseña ha sido restablecida exitosamente.
            </p>

            {/* Instrucciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                Ya puedes cerrar esta ventana y volver a la aplicación <strong>Te Guío</strong> para iniciar sesión con tu nueva contraseña.
              </p>
            </div>

            {/* Botón de cerrar */}
            <Button
              onClick={() => window.close()}
              variant="primary"
              fullWidth
              size="lg"
            >
              Cerrar
            </Button>

            {/* Nota adicional */}
            <p className="mt-4 text-xs text-gray-400">
              Si la ventana no se cierra automáticamente, puedes cerrarla manualmente.
            </p>
          </div>
        </div>

        {/* Logo de la app */}
        <div className="mt-8 text-center">
          <p className="text-white/80 text-sm">Te Guío</p>
          <p className="text-white/50 text-xs mt-1">Encuentra tus productos con facilidad y confianza.</p>
        </div>
      </div>
    );
  }

  // Pantalla de token inválido
  if (!tokenValid) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-[#312c85] to-[#4a45a8] p-4 sm:p-6">
        <div className="card max-w-md w-full overflow-visible">
          <div className="p-6 sm:p-8 text-center">
            {/* Icono de error */}
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-14 h-14 text-red-600" />
              </div>
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Enlace No Válido
            </h1>

            {/* Mensaje */}
            <p className="text-gray-600 mb-4">
              {error || 'Este enlace de recuperación no es válido o ha expirado.'}
            </p>

            {/* Instrucciones */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                Por favor, vuelve a la aplicación <strong>Te Guío</strong> y solicita un nuevo enlace de recuperación de contraseña.
              </p>
            </div>

            {/* Botón de cerrar */}
            <Button
              onClick={() => window.close()}
              variant="primary"
              fullWidth
              size="lg"
            >
              Cerrar
            </Button>

            {/* Nota adicional */}
            <p className="mt-4 text-xs text-gray-400">
              Si la ventana no se cierra automáticamente, puedes cerrarla manualmente.
            </p>
          </div>
        </div>

        {/* Logo de la app */}
        <div className="mt-8 text-center">
          <p className="text-white/80 text-sm">Te Guío</p>
          <p className="text-white/50 text-xs mt-1">Encuentra tus productos con facilidad y confianza.</p>
        </div>
      </div>
    );
  }

  // Formulario de reset
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-[#312c85] to-[#4a45a8] p-4 sm:p-6">
      <div className="card max-w-md w-full overflow-visible">
        <div className="p-6 sm:p-8">
          {/* Icono de candado */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#312c85] to-[#4a45a8] rounded-full flex items-center justify-center">
              <Lock className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Restablecer Contraseña
            </h1>
            <p className="text-sm text-gray-500">
              Ingresa tu nueva contraseña para la app Te Guío
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Alerta de error */}
            {error && (
              <Alert variant="error">
                {error}
              </Alert>
            )}

            {/* Nueva contraseña */}
            <Input
              type={showNewPassword ? 'text' : 'password'}
              label="Nueva Contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              startIcon={<Lock size={20} />}
              endIcon={
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />

            {/* Confirmar contraseña */}
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirmar Contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              startIcon={<Lock size={20} />}
              endIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />

            {/* Indicador de requisitos */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                La contraseña debe tener al menos 6 caracteres
              </p>
            </div>

            {/* Botón de submit */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              disabled={loading}
              className="mt-6"
            >
              Restablecer Contraseña
            </Button>
          </form>
        </div>
      </div>

      {/* Logo de la app */}
      <div className="mt-8 text-center">
        <p className="text-white/80 text-sm">Te Guío</p>
        <p className="text-white/50 text-xs mt-1">Encuentra tus productos con facilidad y confianza.</p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
