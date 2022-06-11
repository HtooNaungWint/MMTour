import axios from 'axios';
import { alertElementShow } from './alert';

export const passwordReset = async (password, passwordConfirmation, token) => {
  try {
    const r = await axios({
      method: 'PATCH',
      url: `http://localhost:3000/api/v1/users/passwordReset/${token}`,
      data: {
        password,
        passwordConfirmation,
      },
    });
    console.log(r);
    if (r.data.status === 'success') {
      alertElementShow(
        'success',
        `Password is successfully updated, please login again`
      );
      //window.location.replace('http://localhost:3000/login');
      //window.location.reload();
    } else {
      alertElementShow('error', `welcome ${r.data.message}`);
    }
  } catch (e) {
    console.log(e);
    alertElementShow('error', `${e.response.data.message}`);
  }
};
