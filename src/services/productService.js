import SharedService from '@services/sharedService';
const ProductDB = require('@db/productDB');
const AccountDB = require('@db/accountDB');
const ProductLabelDB = require('@db/productLabelDB');
const TranslationService = require('@services/translationService');

const AccountActionService = require('./accountActionService');
const { UserAction } = require('@util/enum');

class ProductService {
  static async getSkus(accountId, prefix) {
    let success = false;
    let message = '';
    let products = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      products = await ProductDB.getAllSkus(
        SharedService.getUserOrgId(accountId),
        prefix,
      );
      success = true;
    }
    return { success: success, message: message, products: products };
  }

  static async getProducts(accountId, keyword) {
    let success = false;
    let message = '';
    let products = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      products = await ProductDB.getProducts(
        SharedService.getUserOrgId(accountId),
        keyword,
        20,
      );
      success = true;
    }
    return { success: success, message: message, products: products };
  }

  static async getProductWithContent(accountId, sku) {
    let success = false;
    let message = '';
    let product = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      product = await ProductDB.getProductWithContent(
        SharedService.getUserOrgId(accountId),
        sku,
      );
      //male/female traits not reliable at the moment
      if (
        product &&
        product.reviewAnalysis &&
        product.reviewAnalysis.userTraits
      ) {
        delete product.reviewAnalysis.userTraits.female;
        delete product.reviewAnalysis.userTraits.male;
      }
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, product: product };
  }

  static async setTranslation(accountId, sku, languageCode, content) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      await ProductDB.setTranslation(
        SharedService.getUserOrgId(accountId),
        sku,
        languageCode,
        content,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async createTranslation(
    accountId,
    sku,
    type,
    contentType,
    contentId,
    languageCode,
    language,
    content,
  ) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      if (type === 'machine') {
        const translationRes = await TranslationService.getTranslation(
          accountId,
          languageCode,
          content,
        );
        if (translationRes.success) {
          const req = {
            languageCode: languageCode,
            language: language,
            status: 'Translated',
            source: content,
            translation: translationRes.translation,
            dateRequested: new Date().toISOString(),
            dateCompleted: new Date().toISOString(),
          };
          await ProductDB.setTranslation(
            SharedService.getUserOrgId(accountId),
            sku,
            contentType,
            contentId,
            languageCode,
            req,
          );
          const product = await ProductDB.getProductWithContent(
            SharedService.getUserOrgId(accountId),
            sku,
          );
          await AccountActionService.logAccountAction(accountId, {
            actionType: 'TranslateProductCopy',
            description: UserAction.TranslateProductCopy,
            itemType: 'product copy',
            itemId: sku,
            itemName: product.name,
            changedValue: {
              type: contentType,
              contentId,
              languageCode,
              data: req,
            },
          });
          success = true;
        } else {
          message = translationRes.message;
        }
      } else {
        const req = {
          languageCode: languageCode,
          language: language,
          status: 'Requested',
          source: content,
          dateRequested: new Date().toISOString(),
        };
        await ProductDB.setTranslation(
          SharedService.getUserOrgId(accountId),
          sku,
          contentType,
          contentId,
          languageCode,
          req,
        );
        const product = await ProductDB.getProductWithContent(
          SharedService.getUserOrgId(accountId),
          sku,
        );
        await AccountActionService.logAccountAction(accountId, {
          actionType: 'TranslateProductCopy',
          description: UserAction.TranslateProductCopy,
          itemType: 'product copy',
          itemId: sku,
          itemName: product.name,
          changedValue: {
            type: contentType,
            contentId,
            languageCode,
            data: req,
          },
        });
        success = true;
      }
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async getByAttributes(accountId, filters) {
    let success = false;
    let message = '';
    let products = [];
    let totalCount = 0;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      if (filters.categories) {
        filters.categories = Array.isArray(filters.categories)
          ? filters.categories
          : [filters.categories];
      }
      if (filters.includedFilters) {
        filters.includedFilters = Array.isArray(filters.includedFilters)
          ? filters.includedFilters
          : [filters.includedFilters];
      }

      products = await ProductDB.getProductsByFilter(
        SharedService.getUserOrgId(accountId),
        filters,
      );
      totalCount = 0;
      if (products && products.length > 0) {
        totalCount = products[0].productCount;
      }
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success,
      message,
      products,
      totalCount,
      filters,
    };
  }

  static async setLabels(accountId, sku, labels) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      if (labels) {
        for (let i = 0; i < labels.length; i++) {
          await ProductLabelDB.ensure(
            SharedService.getUserOrgId(accountId),
            labels[i],
          );
        }
      }
      await ProductDB.setLabels(
        sku,
        SharedService.getUserOrgId(accountId),
        labels,
      );
      await AccountActionService.logAccountAction(accountId, {
        actionType: 'SetProductLabel',
        description: UserAction.SetProducLabel,
        itemType: 'product',
        itemId: sku,
        itemName: sku,
        changedValue: {
          labels,
        },
      });
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }
}

module.exports = ProductService;
