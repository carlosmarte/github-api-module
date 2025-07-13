/**
 * GitHub Activity API Type Definitions
 * Generated from OpenAPI specification
 * @module models/types
 */

/**
 * @typedef {Object} SimpleUser
 * @property {string} login
 * @property {number} id
 * @property {string} node_id
 * @property {string} avatar_url
 * @property {string|null} gravatar_id
 * @property {string} url
 * @property {string} html_url
 * @property {string} followers_url
 * @property {string} following_url
 * @property {string} gists_url
 * @property {string} starred_url
 * @property {string} subscriptions_url
 * @property {string} organizations_url
 * @property {string} repos_url
 * @property {string} events_url
 * @property {string} received_events_url
 * @property {string} type
 * @property {boolean} site_admin
 * @property {string} [starred_at]
 * @property {string} [user_view_type]
 * @property {string|null} [name]
 * @property {string|null} [email]
 */

/**
 * @typedef {Object} Actor
 * @property {number} id
 * @property {string} login
 * @property {string} [display_login]
 * @property {string|null} gravatar_id
 * @property {string} url
 * @property {string} avatar_url
 */

/**
 * @typedef {Object} Repository
 * @property {number} id
 * @property {string} node_id
 * @property {string} name
 * @property {string} full_name
 * @property {SimpleUser} owner
 * @property {boolean} private
 * @property {string} html_url
 * @property {string|null} description
 * @property {boolean} fork
 * @property {string} url
 * @property {string} archive_url
 * @property {string} assignees_url
 * @property {string} blobs_url
 * @property {string} branches_url
 * @property {string} collaborators_url
 * @property {string} comments_url
 * @property {string} commits_url
 * @property {string} compare_url
 * @property {string} contents_url
 * @property {string} contributors_url
 * @property {string} deployments_url
 * @property {string} downloads_url
 * @property {string} events_url
 * @property {string} forks_url
 * @property {string} git_commits_url
 * @property {string} git_refs_url
 * @property {string} git_tags_url
 * @property {string} git_url
 * @property {string} issue_comment_url
 * @property {string} issue_events_url
 * @property {string} issues_url
 * @property {string} keys_url
 * @property {string} labels_url
 * @property {string} languages_url
 * @property {string} merges_url
 * @property {string} milestones_url
 * @property {string} notifications_url
 * @property {string} pulls_url
 * @property {string} releases_url
 * @property {string} ssh_url
 * @property {string} stargazers_url
 * @property {string} statuses_url
 * @property {string} subscribers_url
 * @property {string} subscription_url
 * @property {string} tags_url
 * @property {string} teams_url
 * @property {string} trees_url
 * @property {string} clone_url
 * @property {string|null} mirror_url
 * @property {string} hooks_url
 * @property {string} svn_url
 * @property {string|null} homepage
 * @property {string|null} language
 * @property {number} forks_count
 * @property {number} stargazers_count
 * @property {number} watchers_count
 * @property {number} size
 * @property {string} default_branch
 * @property {number} open_issues_count
 * @property {boolean} is_template
 * @property {string[]} topics
 * @property {boolean} has_issues
 * @property {boolean} has_projects
 * @property {boolean} has_wiki
 * @property {boolean} has_pages
 * @property {boolean} has_downloads
 * @property {boolean} has_discussions
 * @property {boolean} archived
 * @property {boolean} disabled
 * @property {string} visibility
 * @property {string|null} pushed_at
 * @property {string|null} created_at
 * @property {string|null} updated_at
 * @property {Object} [permissions]
 * @property {string} [role_name]
 * @property {string} [temp_clone_token]
 * @property {boolean} [allow_forking]
 * @property {boolean} [web_commit_signoff_required]
 * @property {number} [forks]
 * @property {number} [open_issues]
 * @property {number} [watchers]
 * @property {string} [master_branch]
 * @property {string} [starred_at]
 * @property {boolean} [anonymous_access_enabled]
 */

/**
 * @typedef {Object} MinimalRepository
 * @property {number} id
 * @property {string} node_id
 * @property {string} name
 * @property {string} full_name
 * @property {SimpleUser} owner
 * @property {boolean} private
 * @property {string} html_url
 * @property {string|null} description
 * @property {boolean} fork
 * @property {string} url
 * @property {string} archive_url
 * @property {string} assignees_url
 * @property {string} blobs_url
 * @property {string} branches_url
 * @property {string} collaborators_url
 * @property {string} comments_url
 * @property {string} commits_url
 * @property {string} compare_url
 * @property {string} contents_url
 * @property {string} contributors_url
 * @property {string} deployments_url
 * @property {string} downloads_url
 * @property {string} events_url
 * @property {string} forks_url
 * @property {string} git_commits_url
 * @property {string} git_refs_url
 * @property {string} git_tags_url
 * @property {string} git_url
 * @property {string} issue_comment_url
 * @property {string} issue_events_url
 * @property {string} issues_url
 * @property {string} keys_url
 * @property {string} labels_url
 * @property {string} languages_url
 * @property {string} merges_url
 * @property {string} milestones_url
 * @property {string} notifications_url
 * @property {string} pulls_url
 * @property {string} releases_url
 * @property {string} ssh_url
 * @property {string} stargazers_url
 * @property {string} statuses_url
 * @property {string} subscribers_url
 * @property {string} subscription_url
 * @property {string} tags_url
 * @property {string} teams_url
 * @property {string} trees_url
 * @property {string} clone_url
 * @property {string|null} mirror_url
 * @property {string} hooks_url
 * @property {string} svn_url
 * @property {string|null} homepage
 * @property {string|null} language
 * @property {number} forks_count
 * @property {number} stargazers_count
 * @property {number} watchers_count
 * @property {number} size
 * @property {string} default_branch
 * @property {number} open_issues_count
 * @property {boolean} is_template
 * @property {string[]} topics
 * @property {boolean} has_issues
 * @property {boolean} has_projects
 * @property {boolean} has_wiki
 * @property {boolean} has_pages
 * @property {boolean} has_downloads
 * @property {boolean} has_discussions
 * @property {boolean} archived
 * @property {boolean} disabled
 * @property {string} visibility
 * @property {string|null} pushed_at
 * @property {string|null} created_at
 * @property {string|null} updated_at
 */

/**
 * @typedef {Object} EventPayload
 * @property {string} [action]
 * @property {Object} [issue]
 * @property {Object} [comment]
 * @property {Array} [pages]
 * @property {number} [push_id]
 * @property {number} [size]
 * @property {number} [distinct_size]
 * @property {string} [ref]
 * @property {string} [head]
 * @property {string} [before]
 * @property {Array} [commits]
 * @property {string} [ref_type]
 * @property {string} [master_branch]
 * @property {string} [description]
 * @property {string} [pusher_type]
 */

/**
 * @typedef {Object} Event
 * @property {string} id
 * @property {string|null} type
 * @property {Actor} actor
 * @property {Object} repo
 * @property {string} repo.id
 * @property {string} repo.name
 * @property {string} repo.url
 * @property {Actor} [org]
 * @property {EventPayload} payload
 * @property {boolean} public
 * @property {string|null} created_at
 */

/**
 * @typedef {Object} ThreadSubject
 * @property {string} title
 * @property {string} url
 * @property {string} latest_comment_url
 * @property {string} type
 */

/**
 * @typedef {Object} Thread
 * @property {string} id
 * @property {MinimalRepository} repository
 * @property {ThreadSubject} subject
 * @property {string} reason
 * @property {boolean} unread
 * @property {string} updated_at
 * @property {string|null} last_read_at
 * @property {string} url
 * @property {string} subscription_url
 */

/**
 * @typedef {Object} ThreadSubscription
 * @property {boolean} subscribed
 * @property {boolean} ignored
 * @property {string|null} reason
 * @property {string|null} created_at
 * @property {string} url
 * @property {string} [thread_url]
 * @property {string} [repository_url]
 */

/**
 * @typedef {Object} Feed
 * @property {string} timeline_url
 * @property {string} user_url
 * @property {string} [current_user_public_url]
 * @property {string} [current_user_url]
 * @property {string} [current_user_actor_url]
 * @property {string} [current_user_organization_url]
 * @property {string[]} [current_user_organization_urls]
 * @property {string} security_advisories_url
 * @property {string} [repository_discussions_url]
 * @property {string} [repository_discussions_category_url]
 * @property {Object} _links
 */

/**
 * @typedef {Object} Stargazer
 * @property {string} starred_at
 * @property {SimpleUser|null} user
 */

/**
 * @typedef {Object} StarredRepository
 * @property {string} starred_at
 * @property {Repository} repo
 */

/**
 * @typedef {Object} RepositorySubscription
 * @property {boolean} subscribed
 * @property {boolean} ignored
 * @property {string|null} reason
 * @property {string} created_at
 * @property {string} url
 * @property {string} repository_url
 */

/**
 * @typedef {Object} BasicError
 * @property {string} [message]
 * @property {string} [documentation_url]
 * @property {string} [url]
 * @property {string} [status]
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} message
 * @property {string} documentation_url
 * @property {Array<Object>} [errors]
 */

// Export types for use in other modules
export const Types = {
  SimpleUser: 'SimpleUser',
  Actor: 'Actor',
  Repository: 'Repository',
  MinimalRepository: 'MinimalRepository',
  Event: 'Event',
  EventPayload: 'EventPayload',
  Thread: 'Thread',
  ThreadSubject: 'ThreadSubject',
  ThreadSubscription: 'ThreadSubscription',
  Feed: 'Feed',
  Stargazer: 'Stargazer',
  StarredRepository: 'StarredRepository',
  RepositorySubscription: 'RepositorySubscription',
  BasicError: 'BasicError',
  ValidationError: 'ValidationError'
};