const ContentLabelDB = require('../db/contentLabelDB');

class ContentLabelService {
  static async findOrCreateSubscription(accountId, frequency, labels) {
    return await ContentLabelDB.findOrCreateSubscription(
      accountId,
      frequency,
      labels,
    )
      .then((subscription) => ({ success: true, data: subscription }))
      .catch((err) => ({ success: false, message: err }));
  }

  static async updateSubscriptionByAccountId(accountId, labels) {
    return await Promise.all(
      Object.keys(labels).map(async (frequency) => {
        return await ContentLabelDB.findOrCreateSubscription(
          accountId,
          frequency,
          labels[frequency] || [],
        );
      }),
    )
      .then(() => ({ success: true }))
      .catch((err) => ({ success: false, message: err }));
  }

  static async getSubscriptionByAccountId(accountId) {
    return await ContentLabelDB.findSubscriptionByAccountId(accountId)
      .then((data) => ({ success: true, data: data }))
      .catch((err) => ({ success: false, message: err }));
  }
}

module.exports = ContentLabelService;
