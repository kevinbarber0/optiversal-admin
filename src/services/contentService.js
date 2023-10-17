import { v4 as uuidv4 } from 'uuid';
import SharedService from '@services/sharedService';
const AccountDB = require('@db/accountDB');
const QueryService = require('@services/queryService');
const CompletionService = require('@services/completionService');
const PageDB = require('@db/pageDB');
const ProductDB = require('@db/productDB');
const AccountActionService = require('./accountActionService');
const { UserAction } = require('@util/enum');

class ContentService {
  static async getTopicSuggestions(accountId, contentTemplateId, cue) {
    let res = { success: false, message: '', topics: [] };
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const exampleTitles = await PageDB.getExampleTitles(
        SharedService.getUserOrgId(accountId),
        contentTemplateId,
        5,
      );
      let topic = '1.';
      let i = 1;
      if (exampleTitles && exampleTitles.length > 0) {
        for (i = 1; i <= 5 && i <= exampleTitles.length; i++) {
          topic += ' ' + exampleTitles[i - 1] + '\n' + (i + 1) + '.';
        }
      }
      const settings = {
        topic: topic,
        header: cue,
        componentId:
          cue && cue.trim().length > 0
            ? 'Topic Suggestions with Cue'
            : 'Topic Suggestions',
        isLongForm: true,
        temperature: 0.7,
        engine: 'text-davinci-002',
        stops: ['####', i + 5 + '.'],
      };
      const compRes = await CompletionService.getCompletion(
        acct.accountId,
        settings,
      );
      if (compRes.success) {
        res.success = true;
        res.topics = compRes.data.slice(0, 10);
      } else {
        res.message = compRes.message;
      }
    } else {
      res.message = 'Unauthorized';
    }
    return res;
  }

  static async composeProductContent(
    accountId,
    product,
    componentName,
    autoSave,
  ) {
    let res = { success: false, message: '', composition: null };
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      if (
        componentName === 'Product One-Liner' ||
        componentName === 'Product Description'
      ) {
        res = await this.getSimilarCompletion(acct, product, componentName);
      } else {
        res = await this.getTemplateCompletion(acct, product, componentName);
      }
      if (res.success) {
        if (autoSave) {
          //save the composition on the product record
          const contentId = uuidv4();
          await ProductDB.addProductContent(
            SharedService.getUserOrgId(accountId),
            product.sku,
            componentName,
            contentId,
            res.composition,
          );
          await AccountActionService.logAccountAction(accountId, {
            actionType: 'CreateProductCopy',
            description: UserAction.CreateProductCopy,
            itemType: 'product copy',
            itemId: product.sku,
            itemName: product.name,
            changedValue: {
              contentId,
              key: componentName,
              value: res.composition,
            },
          });
        }
        return res;
      }
    } else {
      res.message = 'Unauthorized';
    }
    return res;
  }

  static async getSimilarCompletion(account, product, componentName) {
    //get 10 most similar products (with different SKUs and family IDs)
    const searchRes = await QueryService.keywordSearch(
      account.accountId,
      product.name,
      50,
      [],
      [],
      [product.sku],
      product.familyIds,
    );
    if (searchRes.success) {
      //get the product descriptions that are unique
      const uniqueSimilars = this.getUniqueDescriptions(
        product.name,
        searchRes.products,
        7,
      );
      //construct a prompt that gives similar examples
      const prompt = this.getPrompt(
        product.name,
        componentName,
        uniqueSimilars,
      );
      if (prompt && prompt.trim().length > 0) {
        const starterDescriptions = [];
        uniqueSimilars.slice(0, 7).forEach((product) => {
          starterDescriptions.push(product.description);
        });
        const settings = {
          topic: product.name,
          componentId: componentName,
          content: prompt,
          isLongForm: true,
          temperature: 0.8,
          starterWordSamples: starterDescriptions,
        };
        return await CompletionService.getCompletion(
          account.accountId,
          settings,
        );
      }
    }
    return { success: false, message: '', composition: null };
  }

  static async getTemplateCompletion(account, product, componentName) {
    let header = (product.description || '').replace(/(?:\r\n|\r|\n)+/g, ' ');
    if (
      componentName === 'Product Ideal For' &&
      product.reviewAnalysis &&
      product.reviewAnalysis.pros &&
      Object.keys(product.reviewAnalysis.pros).length > 0
    ) {
      header =
        'Best features: ' +
        Object.keys(product.reviewAnalysis.pros)
          .sort(function (a, b) {
            return (
              product.reviewAnalysis.pros[b] - product.reviewAnalysis.pros[a]
            );
          })
          .slice(0, 5)
          .join(', ');
    }
    let starterDescriptions = null;
    if (
      product.description &&
      product.description.trim().length > 0 &&
      (componentName === 'Product Tweet' ||
        componentName === 'Product Instagram')
    ) {
      starterDescriptions = [product.description];
    }
    const settings = {
      topic: product.name,
      componentId: componentName,
      header: header,
      isLongForm: true,
      temperature: 0.8,
      engine: 'text-davinci-003',
      starterWordSamples: starterDescriptions,
      product: product,
    };
    return await CompletionService.getCompletion(account.accountId, settings);
  }

  static getUniqueDescriptions(targetName, products, max) {
    const unique = [];
    const seenStarters = [];
    products.forEach((product) => {
      if (
        product.name &&
        product.name.trim().length > 0 &&
        product.name
          .toLowerCase()
          .indexOf(targetName.trim().substring(0, 30).toLowerCase()) < 0 &&
        targetName
          .toLowerCase()
          .indexOf(product.name.trim().substring(0, 30).toLowerCase()) < 0 &&
        product.description &&
        product.description.trim().length > 20
      ) {
        const starter = product.description.trim().substring(0, 15);
        if (
          !seenStarters.includes(starter) &&
          product.description
            .trim()
            .toLowerCase()
            .indexOf(product.name.toLowerCase()) !== 0 &&
          this.getFirstSentence(product.description).length > 20
        ) {
          unique.push(product);
          seenStarters.push(starter);
        }
      }
    });
    return unique.slice(0, max);
  }

  static getPrompt(name, type, similarProducts) {
    let prompt = '';
    similarProducts.slice(0, 7).forEach((product) => {
      prompt +=
        'Product: ' +
        product.name +
        '\nDescription: ' +
        (type.indexOf('One-Liner') >= 0
          ? this.getFirstSentence(product.description)
          : this.capLength(product.description)) +
        '`\n####\n';
    });
    prompt += 'Product: ' + name + '\nDescription: ';
    return prompt;
  }

  static getFirstSentence(text) {
    if (text.indexOf('. ') > 0) {
      return text.split('. ')[0] + '.';
    }
    return text;
  }

  static capLength(text) {
    let final = text;
    if (text.trim().indexOf('\n\n') > 0) {
      final = text.split('\n\n')[0];
    }
    if (final.length > 600) {
      final = final.substring(0, 600);
    }
    return final;
  }

  static async getProductContent(accountId, skus) {
    let success = false;
    let message = '';
    const productContent = {};
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const products = await ProductDB.getProductContent(
        SharedService.getUserOrgId(accountId),
        skus,
      );
      if (products) {
        products.forEach((product) => {
          productContent[product.sku] = product.content;
        });
      }
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      productContent: productContent,
    };
  }

  static async setProductContent(accountId, sku, key, value) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      await ProductDB.setProductContent(SharedService.getUserOrgId(accountId), sku, key, value);
      const product = await ProductDB.getProductWithContent(
        SharedService.getUserOrgId(accountId),
        sku,
      );

      await AccountActionService.logAccountAction(accountId, {
        actionType: 'UpdateProductCopy',
        description: UserAction.UpdateProductCopy,
        itemType: 'product copy',
        itemId: sku,
        itemName: product.name,
        changedValue: { key, value },
      });

      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async getProductPageContent(accountId, skus) {
    let success = false;
    let message = '';
    const productContent = {};
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const products = await ProductDB.getProductPageContent(
        SharedService.getUserOrgId(accountId),
        skus,
      );
      if (products) {
        products.forEach((product) => {
          productContent[product.sku] = product.content;
        });
      }
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      productContent: productContent,
    };
  }

  static async setProductPageContent(accountId, sku, key, value) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      await ProductDB.setProductPageContent(
        SharedService.getUserOrgId(accountId),
        sku,
        key,
        value,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }
}

module.exports = ContentService;
