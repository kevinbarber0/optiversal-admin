const SuggestionService = require('@services/suggestionService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const offset = req.query.offset;
    const limit = req.query.limit;
    const filter = req.query.filter;
    const sort = req.query.sort;
    const importedOnly = req.query.imported && req.query.imported === 'true';
    const minQuality = req.query.minq || 0;
    const maxQuality = req.query.maxq || 10;
    const filterLabel = req.query.label;
    const ideaWorkflow = req.query.ideaWorkflow;
    return SuggestionService.getAll(
      req.user.uid,
      offset,
      limit,
      filter,
      importedOnly,
      minQuality,
      maxQuality,
      filterLabel,
      ideaWorkflow,
      sort,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
