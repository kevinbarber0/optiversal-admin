const ConceptDB = require('@db/conceptDB');
const AccountDB = require('@db/accountDB');
const CompletionService = require('@services/completionService');

class ConceptService {
  static async getConcepts(accountId, prefix) {
    let success = false;
    let message = '';
    let concepts = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      concepts = await ConceptDB.getAllConcepts(prefix);
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, concepts: concepts };
  }

  static async authorConceptInsight(accountId, conceptId, type) {
    let success = false;
    let message = '';
    let insight = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const concept = await ConceptDB.getConceptById(conceptId);
      if (concept) {
        let topic = concept.name;
        if (concept.parentConcept) {
          topic += ' (' + concept.parentConcept + ')';
        }
        let promptName = 'Product Type Key Aspects';
        if (type === 'motivations') {
          promptName = 'Product Type Motivations';
        } else if (type === 'issues') {
          promptName = 'Product Type Issues';
        } else if (type === 'descriptions') {
          promptName = 'Product Type Descriptions';
        } else if (type === 'avoid') {
          promptName = 'Product Type Avoided Aspects';
        }
        const settings = {
          topic: topic,
          componentId: promptName,
          stops: ['\n\n'],
        };
        const res = await CompletionService.getCompletion(accountId, settings);
        if (res && res.success) {
          insight = res.data;
          //save to concept
          await ConceptDB.setConceptInsights(conceptId, type, insight);
        }
        success = true;
      } else {
        message = 'Concept not found';
      }
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, insight: insight };
  }

  static async getConceptById(accountId, conceptId) {
    let success = false;
    let message = '';
    let concept = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      concept = await ConceptDB.getConceptById(conceptId);
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, concept: concept };
  }

  static async getConceptInsights(accountId, conceptId) {
    let success = false;
    let message = '';
    let insights = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      insights = await ConceptDB.getConceptInsights(conceptId);
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, insights: insights };
  }

  static async setConceptInsights(accountId, conceptId, key, value) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      await ConceptDB.setConceptInsights(conceptId, key, value);
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }
}

module.exports = ConceptService;
