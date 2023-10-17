const fetch = require('node-fetch');
const { ListingAnalysisResult } = require('@util/enum');

const {
  getChildElementText,
  getDocumentFromRawHTML,
  tryCatcher,
} = require('@helpers/scraping');

export async function retrieveProductQuestions(asin) {
  const data = {};

  // Retrieve Questions
  const questions = await Promise.all(
    new Array(10)
      .fill('')
      .map(
        async (_, i) =>
          await fetch(
            `https://www.amazon.com/ask/questions/asin/${asin}/${i + 1}`,
          ).then((res) => res.text()),
      ),
  );

  data.questions = questions
    .map((questionHTML) => {
      const questionsDocument = getDocumentFromRawHTML(questionHTML);

      if (data.numberOfQuestions === undefined) {
        data.numberOfQuestions = +(
          getChildElementText(
            questionsDocument,
            '.askPaginationHeaderMessage',
          ).split(' of ')[1] || ''
        ).replace(/[^0-9]/g, '');
      }

      return Array.from(
        questionsDocument.querySelectorAll('.askTeaserQuestions > div'),
      ).map((qaElement) => {
        return {
          question: getChildElementText(
            qaElement,
            '[id^="question-"] [data-action="ask-no-op"]',
          ),
          answer:
            getChildElementText(
              qaElement,
              '[id^="question-"] ~ div .askExpanderContainer .askLongText',
            )
              .split('\n')[0]
              .trim() ||
            getChildElementText(
              qaElement,
              '[id^="question-"] ~ div > div > div:nth-child(2) > span',
            ),
          votes: +getChildElementText(qaElement, 'ul.vote .label .count'),
        };
      });
    })
    .reduce((acc, v) => [...acc, ...v], []);

  return data;
}

/**
 * Analyze Product Data
 *
 * @param {Object} qaData
 * @returns analysis data
 */
export async function analyzeQAData(qaData) {
  const analysisData = {
    successes: [],
    warnings: [],
    errors: [],
  };

  for (let i = 0; i < analysisModules.length; i++) {
    const mod = analysisModules[i];
    const res = await tryCatcher(() => mod(qaData));
    if (res) {
      if (res.result === ListingAnalysisResult.Error) {
        analysisData.errors.push(res);
      } else if (res.result === ListingAnalysisResult.Warning) {
        analysisData.warnings.push(res);
      } else {
        analysisData.successes.push(res);
      }
    }
  }

  return analysisData;
}

/**
 * Product QA analysis modules
 */

//check number of unanswered questions
const checkUnansweredQuestions = async (qaData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Unanswered questions',
    message: 'Most or all questions are answered',
    value: 0,
  };

  if (qaData.questions && qaData.questions.length > 0) {
    const unansweredQuestions = (qaData.questions || []).filter(
      (q) => !q.answer,
    );
    analysisObj.value = unansweredQuestions.length + ' unanswered question(s)';

    if (unansweredQuestions.length > 2) {
      analysisObj.result = ListingAnalysisResult.Error;
      analysisObj.message = 'Several unanswered questions';
    } else if (unansweredQuestions.length > 0) {
      analysisObj.result = ListingAnalysisResult.Warning;
      analysisObj.message = 'One or more unanswered questions';
    }
  }
  return analysisObj;
};

const analysisModules = [checkUnansweredQuestions];
