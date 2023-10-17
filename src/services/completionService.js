import SharedService from '@services/sharedService';
const UsageDB = require('@db/usageDB');
const AccountDB = require('@db/accountDB');
const ComponentDB = require('@db/componentDB');
const OpenAI = require('@util/openai');
const Email = require('@util/email');
const tokenizer = require('sbd');
const { Constants } = require('@util/global');
const StringUtil = require('@util/string');

const TOKENS_PER_SENTENCE = 50;

class CompletionService {
  static parseInsights(raw) {
    console.log(raw);
    // format is like:
    // [Q: Who used the product? A:] son (20 years old, male, active)
    // Q: What did the reviewer like about the product? A: color, versatility
    // Q: What did the reviewer dislike about the product? A: nothing
    // Q: What is the product used for? A: exercise, walks, everyday use
    const insights = {};
    if (raw && raw.trim().length > 0) {
      const lines = raw.trim().split('\n');
      if (lines.length > 0) {
        // line 1 -> who1, who2 (traits)
        const whoParts = lines[0].split('\\(');
        if (whoParts.length === 2) {
          insights.boughtFor = whoParts[0]
            .trim()
            .split(', ')
            .filter((i) => i.length < 50);
          if (!whoParts[1].startsWith('?')) {
            insights.userTraits = [
              ...new Set(
                whoParts[1]
                  .replace(')', '')
                  .trim()
                  .split(', ')
                  .filter((i) => i.length() < 50),
              ),
            ];
          }
        }
        if (lines.length > 1) {
          // line 2 -> Q: What did the reviewer like about the product? A: pro1, pro2
          const proList = lines[1].split('A: ')[1];
          if (proList !== 'nothing') {
            insights.pros = [
              ...new Set(proList.split(', ').filter((i) => i.length < 50)),
            ];
          }
          if (lines.length > 2) {
            // line 3 -> Q: What did the reviewer dislike about the product? A: con1, con2
            const conList = lines[2].split('A: ')[1];
            const cons = conList.split(', ');
            for (let i = 0; i < cons.length; i++) {
              const con = cons[i].trim().toLowerCase();
              let allCons = null;
              if (
                con !== 'nothing' &&
                con !== 'no stretch' &&
                con !== 'none' &&
                con !== 'everything' &&
                con !== 'size runs small' &&
                (!allCons || !allCons.includes(con))
              ) {
                if (!allCons) {
                  allCons = [];
                }
                allCons.push(con);
              }
              insights.cons = allCons;
            }
            if (lines.length > 3) {
              // line 4 -> Q: What is the product used for? A: usedfor1, usedfor2
              const useList = lines[3].split('A: ')[1];
              if (useList !== 'unknown') {
                insights.usedFor = [
                  ...new Set(useList.split(', ').filter((i) => i.length < 50)),
                ];
              }
            }
          }
        }
      }
    }
    return insights;
  }

  static async getReviewInsights(review) {
    let success = false;
    let message = '';
    let insights = null;
    const component = await ComponentDB.getById(
      'Review Insights',
      '85OfFzXyl1PlPEOu813BOcKLT7H2',
    );
    if (component) {
      let text = review.replace(/\s+/gi, ' ');
      if (text.length > 1000) {
        text = text.substring(0, 1000);
      }
      const prompt = component.settings.prompt.replace('{{header}}', text);
      //get review insights
      const res = await CompletionService.getRawCompletion(
        null,
        prompt,
        'text-davinci-002',
        500,
        0.0,
        1,
        0.01,
        0.02,
        ['\n\n', 'Product review'],
      );
      if (res.success) {
        insights = CompletionService.parseInsights(res.completion);
        console.log(insights);
        success = true;
      }
    }
    return { success: success, message: message, insights: insights };
  }

  static async getCompletion(accountId, settings) {
    let composition = null;
    let data = null;
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(
      accountId,
      SharedService.getUserOrgId(accountId),
    );
    if (acct) {
      let contentType = settings.contentType || 'paragraph';
      let prompt = settings.prompt
        ? settings.prompt
        : settings.isLongForm
        ? ''
        : `See below for my article titled "{{topic}}". As requested, it is written in a professional tone and references no websites or brand names.\n###\n{{topic}}\n\n{{preface}}{{header}}`;
      let numSentences = settings.numSentences
        ? parseInt(settings.numSentences)
        : 5;
      let intros = settings.intros || [];
      let boostedKeywords = [];
      let suppressedKeywords = [];
      let temperature = settings.temperature;
      let freqPenalty = settings.freqPenalty;
      let presencePenalty = settings.presencePenalty;
      let engine = settings.engine || 'text-davinci-003';
      let stops = null;
      let header = settings.header;
      let completionReplacements = [];
      //look up component settings
      const component = await ComponentDB.getById(
        settings.componentId,
        SharedService.getUserOrgId(accountId),
      );
      let componentName = settings.componentId || 'Free-form';
      if (component) {
        componentName = component.name;
        contentType = component.settings.contentType;
        prompt = component.settings.prompt;
        numSentences = component.settings.numSentences
          ? parseInt(component.settings.numSentences)
          : null;
        intros = component.settings.intros;
        boostedKeywords = component.settings.boostKeywords || [];
        suppressedKeywords = component.settings.suppressedKeywords;
        if (!settings.header && component.settings.header) {
          header = component.settings.header;
        }
        if (component.settings.engine) {
          engine = component.settings.engine;
        }
        if (typeof component.settings.temperature !== 'undefined') {
          temperature = parseFloat(component.settings.temperature);
        }
        if (typeof component.settings.freqPenalty !== 'undefined') {
          freqPenalty = parseFloat(component.settings.freqPenalty);
        }
        if (typeof component.settings.presencePenalty !== 'undefined') {
          presencePenalty = parseFloat(component.settings.presencePenalty);
        }
        if (component.settings.stops) {
          stops = component.settings.stops;
        }
        if (component.settings.completionReplacements) {
          completionReplacements = component.settings.completionReplacements;
        }
      }
      let selectedIntro = '';
      let finalPrompt = this.populatePlaceholders(
        prompt,
        settings.topic,
        header,
        acct,
        settings.preface,
        settings.product,
        settings.sectionContext,
        settings.tokens,
      );
      if (
        intros &&
        intros.length > 0 &&
        (!settings.content || settings.content.trim() === '')
      ) {
        const randomIntroIndex = Math.floor(Math.random() * intros.length);
        selectedIntro = intros[randomIntroIndex];
        finalPrompt += selectedIntro;
      }
      if (finalPrompt.indexOf('STARTER') > 0) {
        finalPrompt = finalPrompt.replace('STARTER', '');
        const starterWord = this.getStarterWord([]);
        selectedIntro = starterWord;
        finalPrompt += starterWord;
        //add opening h2 tag to completion if needed
        if (finalPrompt.indexOf('<h2>' + starterWord) > 0) {
          selectedIntro = '<h2>' + selectedIntro;
        }
      }
      if (settings.content) {
        finalPrompt += settings.content;
      }
      if (
        settings.starterWordSamples &&
        settings.starterWordSamples.length > 0
      ) {
        const starterWord = this.getStarterWord(settings.starterWordSamples);
        selectedIntro = starterWord;
        finalPrompt += ' ' + starterWord;
      }
      const logitBias =
        stops || settings.stops
          ? {}
          : {
              50256: -100,
              2638: -100,
              3740: -100,
              10221: -100,
              32941: -100,
              4841: -100,
              2602: -100,
              37405: -100,
              25947: -100,
              29343: -100,
              1427: -100,
              17569: -100,
              834: -100,
              62: -100,
              628: -100,
            }; //exclude endoftext, http, https, underscores, double newline
      if (
        !settings.stops &&
        !stops &&
        (numSentences === 1 ||
          (contentType === 'paragraph' &&
            (!settings.content || settings.content.indexOf('\n') < 0)))
      ) {
        logitBias['198'] = -100; //exclude newline
        //logitBias["628"] = -100; //double newline
      }
      if (
        settings.componentId &&
        settings.componentId.indexOf('Product') === 0 &&
        !settings.stops &&
        !stops
      ) {
        //exclude I, me, my, our, we, us to avoid first-person style
        logitBias['40'] = -100; //I
        logitBias['314'] = -100; // I
        logitBias['514'] = -100; // us
        logitBias['356'] = -100; // we
        logitBias['502'] = -100; // me
        logitBias['616'] = -100; // my
        logitBias['3666'] = -100; //My
        logitBias['2011'] = -100; // My
        logitBias['5122'] = -100; //Our
        logitBias['1135'] = -100; //We
        logitBias['775'] = -100; // We
      }

      if (acct.orgSettings && acct.orgSettings.boostedWords) {
        acct.orgSettings.boostedWords.forEach((k) => {
          if (k && k.trim() !== '') {
            const encs = OpenAI.getEncodings(k);
            if (encs && encs.length > 0) {
              encs.forEach((enc) => {
                if (enc && enc.length > 0) {
                  logitBias[enc[0]] = 0.5;
                }
              });
            }
          }
        });
      }
      //boost product pros/usedFor if they exist
      if (settings.product && settings.product.reviewAnalysis) {
        if (settings.product.reviewAnalysis.pros) {
          boostedKeywords = boostedKeywords.concat(
            Object.keys(settings.product.reviewAnalysis.pros),
          );
        }
        if (settings.product.reviewAnalysis.usedFor) {
          boostedKeywords = boostedKeywords.concat(
            Object.keys(settings.product.reviewAnalysis.usedFor),
          );
        }
      }

      if (boostedKeywords && boostedKeywords.length > 0) {
        boostedKeywords.forEach((k) => {
          if (k && k.trim() !== '') {
            const encs = OpenAI.getEncodings(k);
            if (encs && encs.length > 0) {
              encs.forEach((enc) => {
                if (enc && enc.length > 0) {
                  logitBias[enc[0]] = 1.0;
                }
              });
            }
          }
        });
      }

      if (
        acct.orgSettings &&
        acct.orgSettings.suppressedWords &&
        acct.orgSettings.suppressedWords.length > 0
      ) {
        acct.orgSettings.suppressedWords.forEach((k) => {
          if (k && k.trim() !== '') {
            const encs = OpenAI.getEncodings(k);
            if (encs && encs.length > 0) {
              encs.forEach((enc) => {
                if (enc && enc.length > 0) {
                  logitBias[enc[0]] = -100;
                }
              });
            }
          }
        });
      }
      if (suppressedKeywords && suppressedKeywords.length > 0) {
        suppressedKeywords.forEach((k) => {
          if (k && k.trim() !== '') {
            const encs = OpenAI.getEncodings(k);
            if (encs && encs.length > 0) {
              encs.forEach((enc) => {
                if (enc && enc.length > 0) {
                  logitBias[enc[0]] = -100;
                }
              });
            }
          }
        });
      }

      if (settings.stops) {
        stops = settings.stops;
      }
      if (!stops || stops.length === 0) {
        stops = ['`', '####', 'Topic:', 'Title:'];
        //if this is a new paragraph, stop at a newline (should never be encountered due to suppression)
        if (
          numSentences === 1 ||
          (contentType === 'paragraph' &&
            (!settings.content || settings.content.trim() === ''))
        ) {
          stops = ['\n', '`', '####'];
        }
        //if this is a completion of existing content, stop at end of sentence
        if (
          numSentences === 1 ||
          (settings.content &&
            settings.content.trim() !== '' &&
            !settings.isLongForm)
        ) {
          stops = ['. ', '!', '`', '.\n'];
        }
      }
      //replace newlines passed in as string literals
      stops = stops.map((stop) => stop.replace(/\\n/g, '\n'));
      //if there's content, just add another sentence
      //otherwise request enough tokens to cover numSentences
      const maxTokens =
        settings.content && settings.content.trim().length > 0
          ? 500
          : numSentences * TOKENS_PER_SENTENCE;
      if (typeof temperature === 'undefined') {
        temperature = 0.5;
      }
      console.log(settings);
      const compRes = await CompletionService.getRawCompletion(
        accountId,
        finalPrompt,
        engine,
        maxTokens,
        temperature,
        1.0,
        freqPenalty || 0.3,
        presencePenalty || 0.3,
        stops,
        logitBias,
      );
      if (compRes.success) {
        composition = compRes.completion;

        //we may want to replace certain words or characters in the completion
        //ex. newlines with <br/> tags
        if (completionReplacements && completionReplacements.length > 0) {
          completionReplacements.forEach((cr) => {
            composition = composition.replaceAll(cr.from, cr.to);
          });
        }

        if (settings.content && !settings.isLongForm) {
          //we don't know what stop sequence was encountered, so just tack on a period for now TODO
          composition += '. ';
        } else {
          if (contentType === 'paragraph') {
            if (
              settings.componentId === Constants.TopicHtmlComponentId ||
              settings.componentId === 'Topic HTML'
            ) {
              //strip links from Topic HTML content
              composition = StringUtil.removeEmptyLinks(composition);
            }
            /*const sentences = tokenizer.sentences(compRes.completion, {});
            if (sentences) {
              composition = sentences.slice(0, numSentences).join(' ');
            }*/
            if (selectedIntro && selectedIntro.length > 0) {
              composition = selectedIntro + composition;
            }
            //log usage
            await UsageDB.save(
              SharedService.getUserOrgId(accountId),
              accountId,
              componentName,
              settings.topic,
              null,
              {
                prompt: finalPrompt,
                engine: engine,
                maxTokens: maxTokens,
                temperature: temperature,
                topP: 1.0,
                frequencyPenalty: 0.3,
                presencePenalty: 0.3,
                stops: stops,
                logitBias: logitBias,
              },
              compRes,
              composition,
            );
          } else if (contentType === 'ul') {
            data = composition.replace(/\n/g, '').split(/\d+\.\s*/);
            if (
              selectedIntro &&
              selectedIntro.length > 0 &&
              data &&
              data.length > 0
            ) {
              data[0] = selectedIntro + data[0];
            }
            composition = '<ul><li>' + data.join('</li><li>') + '</li></ul>';
            //log usage
            await UsageDB.save(
              SharedService.getUserOrgId(accountId),
              accountId,
              componentName,
              settings.topic,
              null,
              {
                prompt: finalPrompt,
                engine: engine,
                maxTokens: maxTokens,
                temperature: temperature,
                topP: 1.0,
                frequencyPenalty: 0.3,
                presencePenalty: 0.3,
                stops: stops,
                logitBias: logitBias,
              },
              compRes,
              data.join(' '),
            );
          } else if (contentType === 'ol') {
            /*composition = '<ol><li>' + composition;
            for (let i = 2; i <= numSentences; i++) {
              composition = composition.replace(i + '/' + numSentences + '-', '</li><li>');
            }
            composition += '</li></ol>';*/
            //make sure it didn't start a new list
            if (composition.indexOf('1) ') > 0) {
              composition = composition.split(/\s+1\)/)[0].trim();
            }
            if (composition.indexOf('1.') > 0) {
              composition = composition.split(/\s+1\./)[0].trim();
            }
            if (composition.indexOf('Bullet 2') > 0) {
              composition = composition.replace(/Bullet /g, '').trim();
            }
            data = composition
              .split(/(?:\n|\s+)\d+ ?(?:\.|:)\s*/)
              .map((d) => d.trim())
              .filter(
                (d) =>
                  d.trim().length > 0 &&
                  (settings.componentId !== 'Topic Suggestions' ||
                    d.trim().length < 100),
              )
              .slice(0, numSentences);
            //data = composition.replace(/\n/g, '').split(/\d+\.\s*/);
            composition = '<ol><li>' + data.join('</li><li>') + '</li></ol>';
            //log usage
            await UsageDB.save(
              SharedService.getUserOrgId(accountId),
              accountId,
              componentName,
              settings.topic,
              null,
              {
                prompt: finalPrompt,
                engine: engine,
                maxTokens: maxTokens,
                temperature: temperature,
                topP: 1.0,
                frequencyPenalty: 0.3,
                presencePenalty: 0.3,
                stops: stops,
                logitBias: logitBias,
              },
              compRes,
              data.join(' '),
            );
          }
        }
      }
      success = compRes.success;
      message = compRes.message;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      composition: composition,
      data: data,
    };
  }

  static getStarterWord(samples) {
    const starters = [
      'A',
      'The',
      'An',
      'With',
      'Be',
      'Are',
      'How',
      'You',
      'When',
      'If',
      'Because',
      'Why',
      'Where',
      'What',
      'Who',
      'Today',
      'Just',
      'So',
      'For',
      'After',
      'Before',
      'Under',
      'Over',
      'Make',
      'Become',
      'While',
      'Bring',
      'Take',
      'It',
    ];
    const startersLength = starters.length;
    for (var i = 0; i < 15; i++) {
      const testChar = starters[Math.floor(Math.random() * startersLength)];
      if (
        !samples.some(
          (s) => s.toLowerCase().indexOf(testChar.toLowerCase()) === 0,
        )
      ) {
        return testChar;
      }
    }
    return 'The';
  }

  static async getDemoCompletion() {
    let description = null;
    let success = false;
    let message = '';

    let topic =
      'adidas X Game of Thrones UltraBoost "White Walkers" Men\'s Shoe';
    let header =
      'adidas presents the adidas X Game of Thrones UltraBoost pack. Get that best-ever feeling on every run. These neutral shoes have a stretchy knit upper with ventilation in key sweat zones to help you stay cool. Energy-returning cushioning and a flexible outsole work together to give you a smooth ride from touch-down to toe-off.';
    let prompt = '';
    //look up component settings
    const component = await ComponentDB.getById(
      'Product Rewritten Description',
      '145',
    );
    let selectedIntro = '';
    if (component) {
      prompt = component.settings.prompt;
      if (prompt.indexOf('STARTER') > 0) {
        prompt = prompt.replace('STARTER', '');
        const starterWord = this.getStarterWord([]);
        selectedIntro = starterWord;
        prompt += starterWord;
      }
    }
    let finalPrompt = this.populatePlaceholders(prompt, topic, header);
    const logitBias = {
      50256: -100,
      2638: -100,
      3740: -100,
      10221: -100,
      32941: -100,
      4841: -100,
      2602: -100,
      37405: -100,
      25947: -100,
      29343: -100,
      1427: -100,
      17569: -100,
      834: -100,
      62: -100,
      628: -100,
    }; //exclude endoftext, http, https, underscores, double newline
    logitBias['198'] = -100; //exclude newline
    //exclude I, me, my, our, we, us to avoid first-person style
    logitBias['40'] = -100; //I
    logitBias['314'] = -100; // I
    logitBias['514'] = -100; // us
    logitBias['356'] = -100; // we
    logitBias['502'] = -100; // me
    logitBias['616'] = -100; // my
    logitBias['3666'] = -100; //My
    logitBias['2011'] = -100; // My
    logitBias['5122'] = -100; //Our
    logitBias['1135'] = -100; //We
    logitBias['775'] = -100; // We
    let stops = ['`', '####', '\n'];

    const maxTokens = 500;
    const compRes = await CompletionService.getRawCompletion(
      '3EbFq51vRChCMYsG1NGCdUgVCW92',
      finalPrompt,
      'text-davinci-002',
      maxTokens,
      0.7,
      1.0,
      0.5,
      0.5,
      stops,
      logitBias,
    );
    if (compRes.success) {
      description = compRes.completion;
      if (selectedIntro && selectedIntro.length > 0) {
        description = selectedIntro + description;
      }
    }
    success = compRes.success;
    message = compRes.message;

    await Email.sendEmail(
      'will@optiversal.com',
      'support@optiversal.com',
      'Demo Description',
      description,
    );

    return { success: success, message: message, description: description };
  }

  static async getSample(
    accountId,
    topic,
    prompt,
    header,
    intros,
    contentType,
    maxSentences,
    boostKeywords,
    suppressKeywords,
    engine,
    temperature,
  ) {
    let composition = null;
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      /*if (contentType === 'ol' || contentType === 'ul') {
        header += ' (top ' + maxSentences + ')';
      }*/
      let finalPrompt = this.populatePlaceholders(prompt, topic, header, acct);
      /*if (contentType === 'ol' || contentType === 'ul') {
        finalPrompt += '1/' + maxSentences + '-';
      }*/
      if (intros && intros.length > 0) {
        finalPrompt += intros[0];
      }
      let selectedIntro = '';
      if (finalPrompt.indexOf('STARTER') > 0) {
        finalPrompt = finalPrompt.replace('STARTER', '');
        const starterWord = this.getStarterWord([]);
        selectedIntro = starterWord;
        finalPrompt += starterWord;
      }
      let temp = temperature;
      if (typeof temperature === 'undefined') {
        temp = 0.5;
      }
      const logitBias = {
        2638: -100,
        3740: -100,
        10221: -100,
        32941: -100,
        4841: -100,
        2602: -100,
        37405: -100,
        25947: -100,
        29343: -100,
        1427: -100,
        17569: -100,
        834: -100,
        62: -100,
      }; //exclude http, https, underscores
      if (contentType === 'paragraph') {
        //logitBias["198"] = -100; //exclude newline
      }
      if (boostKeywords && boostKeywords.length > 0) {
        boostKeywords.forEach((k) => {
          if (k && k.trim() !== '') {
            const encs = OpenAI.getEncodings(k);
            if (encs && encs.length > 0) {
              encs.forEach((enc) => {
                logitBias[enc] = 0.5;
              });
            }
          }
        });
      }
      if (suppressKeywords && suppressKeywords.length > 0) {
        suppressKeywords.forEach((k) => {
          if (k && k.trim() !== '') {
            const encs = OpenAI.getEncodings(k);
            if (encs && encs.length > 0) {
              encs.forEach((enc) => {
                logitBias[enc] = -100;
              });
            }
          }
        });
      }
      let stops = ['`'];
      //if this is a new paragraph, stop at a newline (should never be encountered due to suppression)
      if (contentType === 'paragraph') {
        //stops = ['\n', '`'];
      }
      const compRes = await CompletionService.getRawCompletion(
        accountId,
        finalPrompt,
        engine || 'text-davinci-002',
        maxSentences * TOKENS_PER_SENTENCE,
        temp,
        1.0,
        0.5,
        0.5,
        stops,
        logitBias,
      );
      if (compRes.success) {
        composition = compRes.completion;
        if (contentType === 'paragraph') {
          /*const sentences = tokenizer.sentences(compRes.completion, {});
          if (sentences) {
            composition = sentences.slice(0, maxSentences).join(' ');
          }*/
          if (intros && intros.length > 0) {
            composition =
              intros[0] +
              (composition.trim().indexOf("'") === 0 ? '' : ' ') +
              composition.trim();
          }
          if (selectedIntro && selectedIntro.length > 0) {
            composition = selectedIntro + composition;
          }
        } else if (contentType === 'ul') {
          //composition = '<ul><li>' + composition.replace(/\d\/\d\-/g, '</li><li>') + '</li></ul>';
          composition =
            '<ul><li>' +
            composition.replace(/\d+\.\s*/g, '</li><li>') +
            '</li></ul>';
        } else if (contentType === 'ol') {
          /*composition = '<ol><li>' + composition;
          for (let i = 2; i <= maxSentences; i++) {
            composition = composition.replace(i + '/' + maxSentences + '-', '</li><li>');
          }
          composition += '</li></ol>';*/
          composition =
            '<ol><li>' +
            composition.replace(/\d+\.\s*/g, '</li><li>') +
            '</li></ol>';
        }
      }
      success = compRes.success;
      message = compRes.message;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, composition: composition };
  }

  static populatePlaceholders(
    prompt,
    topic,
    header,
    account,
    preface,
    product,
    sectionContext,
    tokens,
  ) {
    let finalPrompt = prompt;

    if (tokens) {
      Object.keys(tokens).forEach((key) => {
        console.log(`Swapping ${tokens[key]} for {{${key}}}`);
        const re = new RegExp(`{{${key}}}`, 'g');
        finalPrompt = finalPrompt.replace(re, tokens[key]);
      });
    }

    if (product) {
      finalPrompt = finalPrompt.replace(/{{name}}/g, product.name || '');
      let finalDescription = product.description ?? '';
      if (product.description && product.description.trim().length > 0) {
        product.description = product.description.replace(/<br \/>/g, ' ');
        const sentences = tokenizer.sentences(product.description, {});
        if (sentences) {
          finalDescription = sentences.slice(0, 1).join(' ');
        }
      }
      finalPrompt = finalPrompt.replace(/{{description}}/g, finalDescription);
      const filteredFeatures = product.features
        ? product.features.filter((f) => f.length < 50).slice(0, 5)
        : [];
      finalPrompt = finalPrompt.replace(
        /{{features}}/g,
        filteredFeatures.join(', '),
      );
      if (product.reviewAnalysis) {
        let pros = Object.keys(product.reviewAnalysis.pros || {});
        let usedFor = Object.keys(product.reviewAnalysis.usedFor || {});
        if (usedFor && usedFor.length > 0) {
          pros = pros.concat(usedFor);
        }
        if (pros && pros.length > 0) {
          pros = pros.slice(0, 5);
          finalPrompt = finalPrompt.replace(/{{pros}}/g, pros.join(', '));
        } else {
          finalPrompt = finalPrompt.replace(/{{pros}}/g, 'unknown');
        }

        if (usedFor && usedFor.length > 0) {
          usedFor = usedFor.slice(0, 5);
          finalPrompt = finalPrompt.replace(/{{usedfor}}/g, usedFor.join(', '));
        } else {
          finalPrompt = finalPrompt.replace(/{{usedfor}}/g, 'unknown');
        }
      } else {
        finalPrompt = finalPrompt.replace(/{{pros}}/g, 'unknown');
        finalPrompt = finalPrompt.replace(/{{usedfor}}/g, 'unknown');
      }
    }
    finalPrompt = finalPrompt.replace(/{{topic}}/g, topic || '');
    finalPrompt = finalPrompt.replace(/{{header}}/g, header || '');
    finalPrompt = finalPrompt.replace(/{{context}}/g, sectionContext || '');
    finalPrompt = finalPrompt.replace(
      /{{org}}/g,
      account?.orgName || 'Company',
    );
    finalPrompt = finalPrompt.replace(
      /{{productType}}/g,
      account?.orgSettings?.productType || 'product',
    );
    finalPrompt = finalPrompt.replace(/{{preface}}/g, preface ? preface : '');

    return finalPrompt;
  }

  static async getRawCompletion(
    accountId,
    prompt,
    engine,
    maxTokens,
    temperature,
    topP,
    freqPenalty,
    presencePenalty,
    stop,
    logitBias,
    n,
  ) {
    let success = false;
    let message = '';
    const openai = new OpenAI(process.env.OPENAI_API_KEY);
    let resp = null;
    try {
      const settings = {
        engine: engine,
        prompt: prompt,
        maxTokens: maxTokens,
        temperature: temperature,
        topP: topP,
        n: n || 1,
        frequencyPenalty: freqPenalty,
        presencePenalty: presencePenalty,
        stream: false,
        stop: stop,
        logitBias: logitBias,
      };
      console.log(settings);
      try {
        resp = await openai.complete(settings);
        console.log(resp.status);
        if (resp.status !== 200) {
          console.log('failed with status: ' + resp.status);
          resp = await openai.complete(settings);
        }
      } catch (exc) {
        console.log('First completion failed', exc);
        resp = await openai.complete(settings);
      }
      console.log(resp.data);
      success = true;
      //log usage
    } catch (e) {
      console.log(e);
      message = e.message;
      success = false;
    }
    return {
      success: success,
      message: message,
      completion: resp?.data.choices[0].text,
    };
  }
}

module.exports = CompletionService;
