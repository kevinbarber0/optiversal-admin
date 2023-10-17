export async function apiRequest(path, method = 'GET', data, rawData) {
  return await fetch(`/api/${path}`, {
    method: method,
    headers: rawData
      ? {}
      : {
          'Content-Type': 'application/json',
        },
    body: rawData ? rawData : data ? JSON.stringify(data) : undefined,
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.status === 'error') {
        // Automatically signout user if accessToken is no longer valid
        // if (response.code === 'auth/invalid-user-token') {
        //   Router.push('/api/auth/logout');
        // }

        throw new CustomError(response.code, response.message);
      } else {
        return response;
      }
    });
}

export function graphRequest(path, method, data) {
  const header = {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: data ? JSON.stringify(data) : undefined,
  };

  return fetch(`${process.env.GRAPH_SERVICE}${path}`, header).then((response) =>
    response.json(),
  );
}

// Create an Error with custom message and code
export function CustomError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
