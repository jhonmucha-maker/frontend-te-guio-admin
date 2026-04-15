import api from './api';

const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      correo: email,
      contrasena: password,
    });
    return response.data;
  },

  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch {
      return { mensaje: 'ok' };
    }
  },

  verify: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/password/forgot', { correo: email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/password/reset', {
      token,
      nueva_contrasena: newPassword,
    });
    return response.data;
  },
};

export default authService;
