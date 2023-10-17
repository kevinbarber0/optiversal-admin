const CompletionService = require('@services/completionService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const settings = req.body;
    return CompletionService.getSample(
      req.user.uid,
      settings.topic,
      settings.prompt,
      settings.header,
      settings.intros,
      settings.contentType,
      settings.maxSentences,
      settings.boostedKeywords,
      settings.suppressedKeywords,
      settings.engine,
      settings.temperature,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
