import axios from 'axios';
import { alertElementShow } from './alert';

export const passwordReset = async (password, passwordConfirmation, token) => {
  try {
    const r = await axios({
      method: 'PATCH',
      url: `/api/v1/users/passwordReset/${token}`,
      data: {
        password,
        passwordConfirmation,
      },
    });
    if (r.data.status === 'success') {
      alertElementShow(
        'success',
        `Password is successfully updated, please login again`
      );
    } else {
      alertElementShow('error', `welcome ${r.data.message}`);
    }
  } catch (e) {
    alertElementShow('error', `${e.response.data.message}`);
  }
};
