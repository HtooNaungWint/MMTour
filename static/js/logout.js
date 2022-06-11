import axios from 'axios';
import { alertElementShow } from './alert';

export const logout = async () => {
  try {
    const r = await axios({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/users/logout',
    });
    console.log(r);
    if (r.data.status === 'success') {
      alertElementShow('success', `User is now logged out`);
      window.location.replace('http://localhost:3000/login');
      //window.location.reload();
    } else {
      alertElementShow('error', `Logout failed`);
    }
  } catch (e) {
    console.log(e);
    alertElementShow('error', `Logout failed`);
  }
};
