const ReviewService = require('@services/reviewService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const offset = req.query.offset;
    const limit = req.query.limit;
    const skus = req.query.skus;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const minRating = req.query.minRating;
    const maxRating = req.query.maxRating;

    const keyword = req.query.keyword;
    const sort = req.query.sort;
    const id = req.query.id;

    if (id) {
      return ReviewService.getReview(req.user.uid, id).then((result) =>
        res.status(200).json(result),
      );
    } else
      return ReviewService.getReviews(
        req.user.uid,
        offset,
        limit,
        skus,
        startDate,
        endDate,
        minRating,
        maxRating,
        keyword,
        sort,
      ).then((result) => res.status(200).json(result));
  } else if (req.method === 'POST') {
    const review = req.body.review;
    const annotations = req.body.annotations;
    return ReviewService.updateReviewAnnoations(
      req.user.uid,
      review,
      annotations,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
