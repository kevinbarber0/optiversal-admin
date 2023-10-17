const ConceptService = require('@services/conceptService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const conceptId = req.query.id;
    return ConceptService.getConceptInsights(req.user.uid, conceptId).then(
      (result) => res.status(200).json(result),
    );
  } else if (req.method === 'PUT') {
    const conceptId = req.query.id;
    const body = req.body;
    return ConceptService.setConceptInsights(
      req.user.uid,
      conceptId,
      body.key,
      body.value,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
