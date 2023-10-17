
export default async (req, res) => {
  if (req.method === 'PATCH') {
    res.setHeader(
      'Set-Cookie',
      'appSession=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    );
    return res.status(200).json({ message: 'Session cleared.' });
  } else {
    res.status(404);
  }
};
