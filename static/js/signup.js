import axios from 'axios';
import { alertElementShow } from './alert';

export const signup = async (name, email, password, passwordConfirmation) => {
  try {
    const r = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirmation,
      },
    });
    if (r.data.status === 'success') {
      alertElementShow('success', `welcome ${r.data.name}`);
      window.location.replace('/user');
      //window.location.reload();
    } else {
      alertElementShow('error', `welcome ${r.data.message}`);
    }
  } catch (e) {
    alertElementShow('error', `${e.response.data.message}`);
  }
};
