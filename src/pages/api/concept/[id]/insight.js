const ConceptService = require('@services/conceptService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const conceptId = req.query.id;
    const type = req.body.type;
    return ConceptService.authorConceptInsight(
      req.user.uid,
      conceptId,
      type,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
