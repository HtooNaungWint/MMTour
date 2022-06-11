import axios from 'axios';
import { alertElementShow } from './alert';

export const login = async (email, password) => {
  try {
    const r = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    console.log(r);
    if (r.data.status === 'success') {
      alertElementShow('success', `welcome ${r.data.name}`);
      window.location.replace('http://localhost:3000/user');
      //window.location.reload();
    } else {
      alertElementShow('error', `welcome ${r.data.message}`);
    }
  } catch (e) {
    console.log(e);
    alertElementShow('error', `${e.response.data.message}`);
  }
};
