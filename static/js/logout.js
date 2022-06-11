import axios from 'axios';
import { alertElementShow } from './alert';

export const logout = async () => {
  try {
    const r = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if (r.data.status === 'success') {
      alertElementShow('success', `User is now logged out`);
      window.location.replace('/login');
      //window.location.reload();
    } else {
      alertElementShow('error', `Logout failed`);
    }
  } catch (e) {
    alertElementShow('error', `Logout failed`);
  }
};
