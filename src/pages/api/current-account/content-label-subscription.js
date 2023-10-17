const requireAuth = require('@api/_require-auth');
const ContentLabelService = require('@services/contentLabelService');

export default requireAuth((req, res) => {
  const accountId = req.user.uid;
  if (req.method === 'PUT') {
    const labels = req.body;
    return ContentLabelService.updateSubscriptionByAccountId(accountId, labels).then((result) =>
      res.status(200).json(result),
    );
  } else if (req.method === 'GET') {
    return ContentLabelService.getSubscriptionByAccountId(accountId).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
