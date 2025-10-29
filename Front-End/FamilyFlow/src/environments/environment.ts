export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080', // Conectar diretamente ao backend
  endpoints: {
    login: '/users/login',
    register: '/users/register', 
    userMe: '/users/me',
    logout: '/users/logout',
    changePassword: '/users/changePassword'
  }
};