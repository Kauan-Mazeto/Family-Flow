export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  endpoints: {
    login: '/users/login',
    register: '/users/register', 
    userMe: '/users/me',
    logout: '/users/logout',
    changePassword: '/users/changePassword',
    deleteAccount: '/users/delete',
    createFamily: '/family/create',
    enterFamily: '/family/enter',
    familyMembers: '/family/members',
    promoteAdmin: '/family/promote-admin'
  }
};