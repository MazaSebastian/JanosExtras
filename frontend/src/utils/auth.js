export const setAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getAuth = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return {
    token,
    user: user ? JSON.parse(user) : null,
  };
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Limpiar anuncios descartados al cerrar sesión
  // Esto asegura que todos los anuncios vuelvan a aparecer en la próxima sesión
  sessionStorage.removeItem('dismissedAnuncios');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

