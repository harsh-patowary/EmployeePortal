export const isTokenValid = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  // Optional: Parse JWT to check expiration
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch (e) {
    return false;
  }
};

export const redirectToLogin = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
};