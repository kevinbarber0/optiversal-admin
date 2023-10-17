const CompletionService = require('@services/completionService');

const handler = (req, res) => {
  if (req.method === 'POST') {
    return CompletionService.getReviewInsights(req.body.content).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
};

export default handler;