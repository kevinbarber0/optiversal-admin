import SharedService from '@services/sharedService';
const AccountDB = require('@db/accountDB');
const fetch = require('node-fetch');

class SearchServices {
  static async searchRelatedPages(
    accountId,
    title,
    pageId = null,
    pinned = null,
    excluded = null,
    external = null,
  ) {
    let success = false;
    let message = '';
    let pages = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      let apiUrl =
        process.env.SEARCH_SERVICE +
        '/similarpages?o=' +
        encodeURIComponent(SharedService.getUserOrgId(accountId)) +
        '&q=' +
        encodeURIComponent(title);

      if (pageId) apiUrl = apiUrl + '&p=' + encodeURIComponent(pageId);
      if (pinned) apiUrl = apiUrl + '&pinned=' + encodeURIComponent(pinned);
      if (excluded)
        apiUrl = apiUrl + '&excluded=' + encodeURIComponent(excluded);
      if (external) {
        apiUrl = apiUrl + '&external=' + encodeURIComponent(external);
      }
      const result = await fetch(apiUrl);
      pages = await result.json();
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, pages: pages };
  }

  static async searchAnnotationTopics(accountId, atId, query) {
    let success = false;
    let message = '';
    let topics = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const apiUrl =
        process.env.SEARCH_SERVICE +
        '/topics?o=' +
        encodeURIComponent(SharedService.getUserOrgId(accountId)) +
        '&at=' +
        encodeURIComponent(atId) +
        '&q=' +
        encodeURIComponent(query);

      const result = await fetch(apiUrl);
      topics = await result.json();
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success, message, topics };
  }
}

module.exports = SearchServices;
