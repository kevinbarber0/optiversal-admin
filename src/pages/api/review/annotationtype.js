const AnnotationService = require('@services/annotationService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    return AnnotationService.getAnnotationTypes(req.user.uid).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
