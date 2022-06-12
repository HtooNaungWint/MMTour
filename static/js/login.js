import axios from 'axios';
import { alertElementShow } from './alert';

export const login = async (email, password) => {
  try {
    const r = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if (r.data.status === 'success') {
      alertElementShow('success', `welcome ${r.data.data.name}`);
      window.location.replace('/user');
      //window.location.reload();
    } else {
      alertElementShow('error', `welcome ${r.data.message}`);
    }
  } catch (e) {
    alertElementShow('error', `${e.response.data.message}`);
  }
};
