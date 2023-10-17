const axios = require('axios').default;
const getAPIAccessToken = require('@api/auth/accesstoken');

class Auth0Service {
  static async sendResetPassword(email) {
    const options = {
      method: 'POST',
      url: `${process.env.AUTH0_ISSUER_BASE_URL}/dbconnections/change_password`,
      headers: {
        'content-type': 'application/json',
      },
      data: {
        client_id: process.env.AUTH0_CLIENT_ID,
        email,
        connection: 'Username-Password-Authentication',
      },
    };

    return axios
      .request(options)
      .then(async (response) => ({ success: true, data: response.data }))
      .catch((error) => ({ success: false, message: error }));
  }

  static async enableMFA(user_id, email) {
    const accessToken = await getAPIAccessToken();

    return await fetch(
      `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/guardian/enrollments/ticket`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id,
          email,
        }),
      },
    )
      .then((res) => res.json())
      .then((data) => ({ success: true, data: data }))
      .catch((error) => ({ success: false, message: error }));
  }

  static async updateUserProfile(user_id, userData) {
    const accessToken = await getAPIAccessToken();

    return await fetch(
      `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/users/${user_id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      },
    )
      .then((res) => res.json())
      .then((data) => ({ success: true, data: data }))
      .catch((error) => ({ success: false, message: error }));
  }

  static async createUser(userData) {
    const accessToken = await getAPIAccessToken();

    return await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
      .then((res) => res.json())
      .then((data) => ({ success: true, userData: data }))
      .catch((error) => ({ success: false, message: error }));
  }
}

module.exports = Auth0Service;
