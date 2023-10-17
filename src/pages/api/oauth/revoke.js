const fetch = require('node-fetch');

const handler = async (req, res) => {
  if (req.method === 'POST') {
    const result = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${req.body.token}`,
      {
        method: 'POST',
      },
    );

    return res.status(200).json(result);
  } else {
    return res.status(404);
  }
};

export default handler;
