const CompletionService = require('@services/completionService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const settings = req.body;
    return CompletionService.getCompletion(req.user.uid, settings).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
