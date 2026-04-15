import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';
import { STORAGE_KEYS, ROLES } from '../utils/constants';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await authService.login(email, password);

          const { token, refreshToken, usuario } = response;

          localStorage.setItem(STORAGE_KEYS.TOKEN, token);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

          set({
            user: usuario,
            token,
            isAuthenticated: true,
            loading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          const errorMessage = error.message || error.data?.error || 'Error al iniciar sesion';
          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // Ignorar errores de logout
        } finally {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          });
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null });
          return false;
        }

        try {
          const response = await authService.verify();
          const usuario = response.usuario || response;

          set({
            user: usuario,
            isAuthenticated: true,
            token,
          });
          return true;
        } catch {
          get().logout();
          return false;
        }
      },

      clearError: () => set({ error: null }),

      isAdmin: () => {
        const { user } = get();
        return user?.rol === ROLES.ADMINISTRADOR;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
