import SharedService from '@services/sharedService';
const QueryDB = require('@db/queryDB');
const ConceptDB = require('@db/conceptDB');
const AccountDB = require('@db/accountDB');
const OpenAI = require('@util/openai');
const QueryService = require('@services/queryService');
const ComponentDB = require('@db/componentDB');

const MAX_DOCS = 200;
const MAX_CATS = 10;

class SemanticSearchService {
  static async getTopProducts(
    accountId,
    topic,
    componentId,
    productExclusions,
    categoryExclusions,
  ) {
    let success = false;
    let message = '';
    let products = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const component = await ComponentDB.getById(
        componentId,
        SharedService.getUserOrgId(accountId),
      );
      const categories = [];
      const concepts = [];

      const searchRes = await QueryService.keywordSearch(
        accountId,
        topic.toLowerCase(),
        200,
        categories.map((c) => c.categoryId),
        concepts.map((c) => c.conceptId),
      );
      if (searchRes.success && searchRes.products.length > 0) {
        products = searchRes.products.slice(0, component.settings.numSentences);
      }
      console.log('Final products....');
      console.log(products);
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, products: products };
  }

  static populatePlaceholders(prompt, topic, header, account, preface) {
    let finalPrompt = prompt;
    finalPrompt = finalPrompt.replace(/{{topic}}/g, topic.toLowerCase() || '');
    finalPrompt = finalPrompt.replace(/{{header}}/g, header || '');
    finalPrompt = finalPrompt.replace(/{{org}}/g, account.orgName || 'BigCo');
    finalPrompt = finalPrompt.replace(/{{preface}}/g, preface ? preface : '');
    return finalPrompt;
  }

  static async getSearchResults(accountId, engine, query, documents) {
    let success = false;
    let message = '';
    const openai = new OpenAI(process.env.OPENAI_API_KEY);
    let resp = null;
    try {
      const settings = {
        engine: engine,
        query: query,
        documents: documents,
      };
      //console.log(settings);
      resp = await openai.search(settings);
      success = true;
      //console.log(JSON.stringify(resp.data));
      //log usage
    } catch (e) {
      console.log(e);
      message = e.message;
    }
    return { success: success, message: message, documents: resp.data.data };
  }
}

module.exports = SemanticSearchService;
