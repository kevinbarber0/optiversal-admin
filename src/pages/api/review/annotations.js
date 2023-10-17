const ReviewService = require('@services/reviewService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const id = req.query.id;
    return ReviewService.getReviewAnnotations(req.user.uid, id).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
