const CompletionService = require('@services/completionService');

export default (req, res) => {
  if (req.method === 'POST') {
    const settings = req.body;
    return CompletionService.getCompletion(
      '3EbFq51vRChCMYsG1NGCdUgVCW92',
      settings.topic,
      settings.componentId,
      settings.header,
      settings.preface,
      settings.content,
      false,
      0.0,
      'text-davinci-002',
      ['###', '####', '##'],
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
};
