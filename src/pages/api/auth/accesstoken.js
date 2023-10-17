const getAccessToken = async () => {
    var options = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.AUTH0_API_CLIENT_ID,
        client_secret: process.env.AUTH0_API_CLIENT_SECRET,
        audience: `${process.env.AUTH0_API_ISSUER_BASE_URL}/api/v2/`,
        grant_type: 'client_credentials',
      }),
    };
  
    return await fetch(
      `${process.env.AUTH0_API_ISSUER_BASE_URL}/oauth/token`,
      options,
    )
      .then(async (response) => response.json())
      .then((response) => {
        if (response.status === 'error') {
          throw new Error(response.code, response.message);
        } else {
          return response.access_token;
        }
      });
  };
  
  module.exports = getAccessToken;
  