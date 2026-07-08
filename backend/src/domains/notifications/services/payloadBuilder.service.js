/**
 * payloadBuilder.service.js
 * Constructs sanitized payload data structures for provider dispatch without bloat.
 */

class PayloadBuilderService {
  /**
   * Builds normalized notification payload for provider formatting.
   * @param {Object} policyResult 
   * @param {Object} mappedTemplate 
   * @param {string} [language='en_US'] 
   * @returns {Object}
   */
  build(policyResult, mappedTemplate, language = 'en_US') {
    return {
      recipientPhone: policyResult.recipientPhone,
      templateName: mappedTemplate.templateName,
      templateVersion: mappedTemplate.templateVersion,
      language: language,
      variables: mappedTemplate.variables,
      category: mappedTemplate.category,
      priority: mappedTemplate.priority
    };
  }
}

module.exports = new PayloadBuilderService();
