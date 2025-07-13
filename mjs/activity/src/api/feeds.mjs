/**
 * GitHub Feeds API
 * @module api/feeds
 */

/**
 * Feeds API endpoints
 */
export class FeedsAPI {
  /**
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Get feeds
   * Lists the feeds available to the authenticated user
   * @returns {Promise<Object>} Feeds response
   */
  async getFeeds() {
    const response = await this.http.get('/feeds');
    return response.data;
  }

  /**
   * Get timeline feed URL
   * @returns {Promise<string>} Timeline feed URL
   */
  async getTimelineFeedUrl() {
    const feeds = await this.getFeeds();
    return feeds.timeline_url;
  }

  /**
   * Get user feed URL template
   * @returns {Promise<string>} User feed URL template
   */
  async getUserFeedUrl() {
    const feeds = await this.getFeeds();
    return feeds.user_url;
  }

  /**
   * Get current user public feed URL
   * @returns {Promise<string>} Current user public feed URL
   */
  async getCurrentUserPublicFeedUrl() {
    const feeds = await this.getFeeds();
    return feeds.current_user_public_url;
  }

  /**
   * Get current user feed URL (private)
   * @returns {Promise<string>} Current user feed URL
   */
  async getCurrentUserFeedUrl() {
    const feeds = await this.getFeeds();
    return feeds.current_user_url;
  }

  /**
   * Get current user actor feed URL
   * @returns {Promise<string>} Current user actor feed URL
   */
  async getCurrentUserActorFeedUrl() {
    const feeds = await this.getFeeds();
    return feeds.current_user_actor_url;
  }

  /**
   * Get current user organization feed URLs
   * @returns {Promise<Array<string>>} Organization feed URLs
   */
  async getCurrentUserOrganizationFeedUrls() {
    const feeds = await this.getFeeds();
    return feeds.current_user_organization_urls || [];
  }

  /**
   * Get security advisories feed URL
   * @returns {Promise<string>} Security advisories feed URL
   */
  async getSecurityAdvisoriesFeedUrl() {
    const feeds = await this.getFeeds();
    return feeds.security_advisories_url;
  }

  /**
   * Get repository discussions feed URL template
   * @returns {Promise<string>} Repository discussions feed URL template
   */
  async getRepositoryDiscussionsFeedUrl() {
    const feeds = await this.getFeeds();
    return feeds.repository_discussions_url;
  }

  /**
   * Get repository discussions category feed URL template
   * @returns {Promise<string>} Repository discussions category feed URL template
   */
  async getRepositoryDiscussionsCategoryFeedUrl() {
    const feeds = await this.getFeeds();
    return feeds.repository_discussions_category_url;
  }

  /**
   * Get all feed links
   * @returns {Promise<Object>} All feed links
   */
  async getAllFeedLinks() {
    const feeds = await this.getFeeds();
    return feeds._links;
  }

  /**
   * Generate user feed URL for a specific user
   * @param {string} username - GitHub username
   * @returns {Promise<string>} User feed URL
   */
  async generateUserFeedUrl(username) {
    const template = await this.getUserFeedUrl();
    return template.replace('{user}', username);
  }

  /**
   * Generate repository discussions feed URL
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<string>} Repository discussions feed URL
   */
  async generateRepositoryDiscussionsFeedUrl(owner, repo) {
    const template = await this.getRepositoryDiscussionsFeedUrl();
    return template
      .replace('{user}', owner)
      .replace('{repo}', repo);
  }

  /**
   * Generate repository discussions category feed URL
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} category - Discussion category
   * @returns {Promise<string>} Repository discussions category feed URL
   */
  async generateRepositoryDiscussionsCategoryFeedUrl(owner, repo, category) {
    const template = await this.getRepositoryDiscussionsCategoryFeedUrl();
    return template
      .replace('{user}', owner)
      .replace('{repo}', repo)
      .replace('{category}', category);
  }

  /**
   * Check if authenticated user has private feeds
   * @returns {Promise<boolean>} True if private feeds are available
   */
  async hasPrivateFeeds() {
    const feeds = await this.getFeeds();
    return !!(feeds.current_user_url && feeds.current_user_actor_url);
  }

  /**
   * Get feed metadata
   * @returns {Promise<Object>} Feed metadata
   */
  async getFeedMetadata() {
    const feeds = await this.getFeeds();
    const links = feeds._links || {};
    
    return {
      hasTimeline: !!feeds.timeline_url,
      hasUserFeed: !!feeds.user_url,
      hasCurrentUserPublic: !!feeds.current_user_public_url,
      hasCurrentUserPrivate: !!feeds.current_user_url,
      hasCurrentUserActor: !!feeds.current_user_actor_url,
      hasOrganizationFeeds: (feeds.current_user_organization_urls || []).length > 0,
      hasSecurityAdvisories: !!feeds.security_advisories_url,
      hasRepositoryDiscussions: !!feeds.repository_discussions_url,
      totalFeedTypes: Object.keys(links).length,
      feedTypes: Object.keys(links)
    };
  }

  /**
   * Get all available feed URLs
   * @returns {Promise<Array>} Array of feed objects with name and URL
   */
  async getAllAvailableFeeds() {
    const feeds = await this.getFeeds();
    const availableFeeds = [];

    if (feeds.timeline_url) {
      availableFeeds.push({
        name: 'Timeline',
        type: 'timeline',
        url: feeds.timeline_url,
        public: true
      });
    }

    if (feeds.current_user_public_url) {
      availableFeeds.push({
        name: 'Current User (Public)',
        type: 'current_user_public',
        url: feeds.current_user_public_url,
        public: true
      });
    }

    if (feeds.current_user_url) {
      availableFeeds.push({
        name: 'Current User (Private)',
        type: 'current_user',
        url: feeds.current_user_url,
        public: false
      });
    }

    if (feeds.current_user_actor_url) {
      availableFeeds.push({
        name: 'Current User Actor',
        type: 'current_user_actor',
        url: feeds.current_user_actor_url,
        public: false
      });
    }

    if (feeds.security_advisories_url) {
      availableFeeds.push({
        name: 'Security Advisories',
        type: 'security_advisories',
        url: feeds.security_advisories_url,
        public: true
      });
    }

    if (feeds.current_user_organization_urls) {
      feeds.current_user_organization_urls.forEach((url, index) => {
        availableFeeds.push({
          name: `Organization Feed ${index + 1}`,
          type: 'organization',
          url: url,
          public: false
        });
      });
    }

    return availableFeeds;
  }
}

export default FeedsAPI;