export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  endpoints: {
    login: '/users/login',
    register: '/users/register', 
    userMe: '/users/me',
    logout: '/users/logout',
    changePassword: '/users/changePassword',
    createFamily: '/family/create',
    enterFamily: '/family/enter'
  }
};