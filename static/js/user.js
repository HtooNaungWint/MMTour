import axios from 'axios';
import { alertElementShow } from './alert';

export const userUpdate = async (name, email, picture) => {
  try {
    const r = await axios({
      method: 'PATCH',
      url: 'http://localhost:3000/api/v1/users/userUpdate',
      data: {
        name,
        email,
        picture,
      },
      headers: {
        'content-type': 'multipart/form-data',
      },
    });
    console.log(r);
    if (r.data.status === 'success') {
      alertElementShow(
        'success',
        `Your information has been updated\r\nPlease refresh your page to reflect the updated information`
      );
      //window.location.replace('http://localhost:3000/user');
      //window.location.reload();
    } else {
      alertElementShow('error', `something went wrong update fail`);
    }
  } catch (e) {
    console.log(e);
    alertElementShow('error', `${e.response.data.message}`);
  }
};

export const passwordUpdate = async (
  password,
  newPassword,
  newPasswordConfirm
) => {
  try {
    const r = await axios({
      method: 'PATCH',
      url: 'http://localhost:3000/api/v1/users/passwordUpdate',
      data: {
        password,
        newPassword,
        newPasswordConfirm,
      },
    });
    console.log(r);
    if (r.data.status === 'success') {
      alertElementShow(
        'success',
        `Your information has been updated\r\nPlease refresh your page to reflect the updated information`
      );
      //window.location.replace('http://localhost:3000/user');
      //window.location.reload();
    } else {
      alertElementShow('error', `something went wrong update fail`);
    }
  } catch (e) {
    console.log(e);
    alertElementShow('error', `${e.response.data.message}`);
  }
};
