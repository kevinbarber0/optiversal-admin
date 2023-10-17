import Cors from 'cors';
const CompletionService = require('@services/completionService');

// Initializing the cors middleware
const cors = Cors({
  methods: ['POST', 'HEAD'],
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

export default async (req, res) => {
  // Run the middleware
  await runMiddleware(req, res, cors);

  if (req.method === 'POST') {
    return CompletionService.getDemoCompletion().then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
};
