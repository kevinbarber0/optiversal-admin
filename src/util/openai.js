const axios = require('axios');
const { encode } = require('gpt-3-encoder');
const DEFAULT_ENGINE = 'text-davinci-002';
const AWSUtility = require('./aws');
//const ENGINE_LIST = ['ada', 'babbage', 'curie', 'text-davinci-002'];

class OpenAI {
  constructor(api_key) {
    this._api_key = api_key;
  }

  _safe_cast(number) {
    return number ? Number(number) : null;
  }

  _completionURL(engine) {
    if (!engine) {
      engine = DEFAULT_ENGINE;
    }
    if (engine.indexOf('ft-') >= 0) {
      return `https://api.openai.com/v1/completions`;
    } else {
      return `https://api.openai.com/v1/engines/${engine}/completions`;
    }
  }

  _send_request(opts) {
    const url = this._completionURL(opts.engine);
    const reqOpts = {
      headers: {
        Authorization: `Bearer ${this._api_key}`,
        'Content-Type': 'application/json',
      },
    };
    const data = {
      prompt: opts.prompt,
      max_tokens: this._safe_cast(opts.maxTokens),
      temperature: opts.temperature,
      top_p: this._safe_cast(opts.topP),
      n: this._safe_cast(opts.n),
      frequency_penalty: this._safe_cast(opts.frequencyPenalty),
      presence_penalty: this._safe_cast(opts.presencePenalty),
      stream: opts.stream,
      stop: opts.stop,
      logit_bias: opts.logitBias,
      logprobs: 1,
    };
    if (opts.engine.indexOf('ft-') >= 0) {
      data.model = opts.engine;
    }
    const stage = process.env.STAGE;
    if (stage === 'prod') {
      AWSUtility.saveObjectToS3(
        'optiversal-app-logging',
        `openai-requests/${new Date().toISOString()}.json`,
        data,
      );
    }
    return axios.post(url, data, reqOpts);
  }

  static getEncodings(str) {
    if (!str || str.trim() === '') {
      return [];
    }
    //variants: capitailzed, capitalized space before, original, original space before
    const encodedVariants = [];
    const capitalized = str.charAt(0).toUpperCase() + str.slice(1);
    encodedVariants.push(encode(str));
    encodedVariants.push(encode(' ' + str));
    encodedVariants.push(encode(capitalized));
    encodedVariants.push(encode(' ' + capitalized));
    return encodedVariants;
  }

  complete(opts) {
    return this._send_request(opts);
  }
}

module.exports = OpenAI;
