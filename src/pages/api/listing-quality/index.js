import ListingAnalysisService from '@services/listingAnalysisService';

const handler = (req, res) => {
  if (req.method === 'POST') {
    return ListingAnalysisService.createService(req.body.url)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          success: false,
          err,
        });
      });
  } else {
    return res.status(404);
  }
};

export default handler;
