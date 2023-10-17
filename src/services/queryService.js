import SharedService from '@services/sharedService';
const QueryDB = require('@db/queryDB');
const AccountDB = require('@db/accountDB');
const LabelDB = require('@db/labelDB');
const ProductLabelDB = require('@db/productLabelDB');
const fetch = require('node-fetch');

class QueryService {
  static async parse(accountId, q) {
    let success = false;
    let message = '';
    let query = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const apiUrl =
        process.env.SEARCH_SERVICE +
        '/parse?o=' +
        encodeURIComponent(SharedService.getUserOrgId(accountId)) +
        '&q=' +
        encodeURIComponent(q);
      console.log(apiUrl);
      const result = await fetch(apiUrl);
      query = await result.json();
      console.log(JSON.stringify(query));
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, query: query };
  }

  static async search(accountId, q, loc) {
    let success = false;
    let message = '';
    let products = [];
    let qualityMetrics = null;
    let searchMetadata = null;
    let resultKey = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      let apiUrl =
        process.env.SEARCH_SERVICE +
        '/parsedsearch?o=' +
        encodeURIComponent(SharedService.getUserOrgId(accountId));
      if (loc) apiUrl += `&loc=${loc.id}`;
      // console.log('query+: ', JSON.stringify(q));
      console.log(apiUrl);
      const result = await fetch(apiUrl, {
        method: 'post',
        body: JSON.stringify(q),
      });
      const productResult = await result.json();
      console.log(JSON.stringify(productResult));
      products = productResult.products;
      qualityMetrics = productResult.qualityMetrics;
      searchMetadata = productResult.searchMetadata;
      resultKey = productResult.resultKey;
      success = true;
    }
    return {
      success,
      message,
      products,
      qualityMetrics,
      searchMetadata,
      resultKey,
    };
  }

  static async keywordSearch(
    accountId,
    q,
    maxResults,
    categoryIds,
    conceptIds,
    excludedSkus,
    excludedFamilyIds,
    excludedCategories,
  ) {
    let success = false;
    let message = '';
    let products = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      let finalQuery = q.replace('  ', ' ').replace('-', ' ');
      //finalQuery = sw.removeStopwords(finalQuery.split(' ')).join('~ ') + '~';
      console.log(finalQuery);
      const params = {
        query: finalQuery,
        categoryIds: categoryIds,
        conceptIds: conceptIds,
        excludedSkus: excludedSkus,
        excludedFamilyIds: excludedFamilyIds,
        maxResults: maxResults,
      };
      const apiUrl =
        process.env.SEARCH_SERVICE +
        '/keywordsearch?o=' +
        encodeURIComponent(SharedService.getUserOrgId(accountId));
      console.log(apiUrl);
      const result = await fetch(apiUrl, {
        method: 'post',
        body: JSON.stringify(params),
      });
      const productResult = await result.json();
      //console.log(JSON.stringify(productResult));
      products = productResult;
      success = true;
    }
    return { success: success, message: message, products: products };
  }

  static async nameSkuSearch(accountId, q, maxResults) {
    let success = false;
    let message = '';
    let products = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const params = {
        query: q,
        maxResults: maxResults,
      };
      const apiUrl =
        process.env.SEARCH_SERVICE +
        '/namesearch?o=' +
        encodeURIComponent(SharedService.getUserOrgId(accountId));
      console.log(apiUrl);
      const result = await fetch(apiUrl, {
        method: 'post',
        body: JSON.stringify(params),
      });
      const productResult = await result.json();
      //console.log(JSON.stringify(productResult));
      products = productResult;
      success = true;
    }
    return { success: success, message: message, products: products };
  }

  static async getConcepts(prefix) {
    let success = true;
    let message = '';
    const concepts = await QueryDB.getAllConcepts(prefix);
    return { success: success, message: message, concepts: concepts };
  }

  static async getFeatureNames(prefix) {
    let success = true;
    let message = '';
    const features = await QueryDB.getAllFeatureNames(prefix);
    return { success: success, message: message, features: features };
  }

  static async getCategories(accountId, prefix) {
    let success = false;
    let message = '';
    let categories = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      categories = await QueryDB.getAllCategories(
        SharedService.getUserOrgId(accountId),
        prefix,
      );
      success = true;
    }
    return { success: success, message: message, categories: categories };
  }

  static async getCategoryByIds(accountId, categoryIds) {
    let success = false;
    let message = '';
    let categories = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      categories = await QueryDB.getCategoryByIds(
        SharedService.getUserOrgId(accountId),
        categoryIds,
      );
      success = true;
    }
    return { success: success, message: message, categories: categories };
  }

  static async getLabels(accountId, prefix) {
    let success = false;
    let message = '';
    let labels = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      labels = await LabelDB.getAll(
        SharedService.getUserOrgId(accountId),
        prefix,
      );
      success = true;
    }
    return { success: success, message: message, labels: labels };
  }

  static async getCustomAttributes(accountId, prefix) {
    let success = true;
    let message = '';
    let attributes = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      attributes = await QueryDB.getAllCustomAttributes(
        SharedService.getUserOrgId(accountId),
        prefix,
      );
    }
    return { success: success, message: message, attributes: attributes };
  }

  static async getProductLabels(accountId, prefix) {
    let success = false;
    let message = '';
    let labels = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      labels = await ProductLabelDB.getAll(
        SharedService.getUserOrgId(accountId),
        prefix,
      );
      success = true;
    }
    return { success: success, message: message, labels: labels };
  }
}

module.exports = QueryService;
