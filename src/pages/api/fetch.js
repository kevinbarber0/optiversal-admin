const fetch = require('node-fetch');
const Email = require('@util/email');

const handler = async (req, res) => {
  if (req.method === 'GET') {
    await Email.sendEmail(
      'will@optiversal.com',
      'support@optiversal.com',
      'BBY Review Fetch',
      req.query.url,
    );
    return fetch(req.query.url).then((jsonRes) => jsonRes.json()).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
};

export default handler;
