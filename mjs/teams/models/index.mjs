export const TeamSchema = {
  id: { type: 'integer', required: true },
  node_id: { type: 'string', required: true },
  url: { type: 'string', format: 'uri', required: true },
  html_url: { type: 'string', format: 'uri', required: true },
  name: { type: 'string', required: true },
  slug: { type: 'string', required: true },
  description: { type: 'string', nullable: true, required: true },
  privacy: { type: 'string', enum: ['closed', 'secret'], required: true },
  notification_setting: { type: 'string', required: true },
  permission: { type: 'string', required: true },
  members_url: { type: 'string', required: true },
  repositories_url: { type: 'string', format: 'uri', required: true },
  parent: { type: 'object', nullable: true, required: true }
};

export const TeamFullSchema = {
  ...TeamSchema,
  members_count: { type: 'integer', required: true },
  repos_count: { type: 'integer', required: true },
  created_at: { type: 'string', format: 'date-time', required: true },
  updated_at: { type: 'string', format: 'date-time', required: true },
  organization: { type: 'object', required: true },
  ldap_dn: { type: 'string' }
};

export const TeamDiscussionSchema = {
  author: { type: 'object', nullable: true, required: true },
  body: { type: 'string', required: true },
  body_html: { type: 'string', required: true },
  body_version: { type: 'string', required: true },
  comments_count: { type: 'integer', required: true },
  comments_url: { type: 'string', format: 'uri', required: true },
  created_at: { type: 'string', format: 'date-time', required: true },
  last_edited_at: { type: 'string', format: 'date-time', nullable: true, required: true },
  html_url: { type: 'string', format: 'uri', required: true },
  node_id: { type: 'string', required: true },
  number: { type: 'integer', required: true },
  pinned: { type: 'boolean', required: true },
  private: { type: 'boolean', required: true },
  team_url: { type: 'string', format: 'uri', required: true },
  title: { type: 'string', required: true },
  updated_at: { type: 'string', format: 'date-time', required: true },
  url: { type: 'string', format: 'uri', required: true },
  reactions: { type: 'object' }
};

export const TeamDiscussionCommentSchema = {
  author: { type: 'object', nullable: true, required: true },
  body: { type: 'string', required: true },
  body_html: { type: 'string', required: true },
  body_version: { type: 'string', required: true },
  created_at: { type: 'string', format: 'date-time', required: true },
  last_edited_at: { type: 'string', format: 'date-time', nullable: true, required: true },
  discussion_url: { type: 'string', format: 'uri', required: true },
  html_url: { type: 'string', format: 'uri', required: true },
  node_id: { type: 'string', required: true },
  number: { type: 'integer', required: true },
  updated_at: { type: 'string', format: 'date-time', required: true },
  url: { type: 'string', format: 'uri', required: true },
  reactions: { type: 'object' }
};

export const TeamMembershipSchema = {
  url: { type: 'string', format: 'uri', required: true },
  role: { type: 'string', enum: ['member', 'maintainer'], default: 'member', required: true },
  state: { type: 'string', enum: ['active', 'pending'], required: true }
};

export const TeamRepositorySchema = {
  id: { type: 'integer', required: true },
  node_id: { type: 'string', required: true },
  name: { type: 'string', required: true },
  full_name: { type: 'string', required: true },
  license: { type: 'object', nullable: true },
  forks: { type: 'integer', required: true },
  permissions: { type: 'object' },
  role_name: { type: 'string' },
  owner: { type: 'object', nullable: true, required: true },
  private: { type: 'boolean', default: false, required: true },
  html_url: { type: 'string', format: 'uri', required: true },
  description: { type: 'string', nullable: true },
  fork: { type: 'boolean', required: true },
  url: { type: 'string', format: 'uri', required: true }
};

export const TeamProjectSchema = {
  owner_url: { type: 'string', required: true },
  url: { type: 'string', required: true },
  html_url: { type: 'string', required: true },
  columns_url: { type: 'string', required: true },
  id: { type: 'integer', required: true },
  node_id: { type: 'string', required: true },
  name: { type: 'string', required: true },
  body: { type: 'string', nullable: true, required: true },
  number: { type: 'integer', required: true },
  state: { type: 'string', required: true },
  creator: { type: 'object', required: true },
  created_at: { type: 'string', required: true },
  updated_at: { type: 'string', required: true },
  organization_permission: { type: 'string' },
  private: { type: 'boolean' },
  permissions: { type: 'object', required: true }
};

export const OrganizationInvitationSchema = {
  id: { type: 'integer', format: 'int64', required: true },
  login: { type: 'string', nullable: true, required: true },
  email: { type: 'string', nullable: true, required: true },
  role: { type: 'string', required: true },
  created_at: { type: 'string', required: true },
  failed_at: { type: 'string', nullable: true },
  failed_reason: { type: 'string', nullable: true },
  inviter: { type: 'object', required: true },
  team_count: { type: 'integer', required: true },
  node_id: { type: 'string', required: true },
  invitation_teams_url: { type: 'string', required: true },
  invitation_source: { type: 'string' }
};

export const SimpleUserSchema = {
  login: { type: 'string', required: true },
  id: { type: 'integer', format: 'int64', required: true },
  node_id: { type: 'string', required: true },
  avatar_url: { type: 'string', format: 'uri', required: true },
  gravatar_id: { type: 'string', nullable: true, required: true },
  url: { type: 'string', format: 'uri', required: true },
  html_url: { type: 'string', format: 'uri', required: true },
  followers_url: { type: 'string', format: 'uri', required: true },
  following_url: { type: 'string', required: true },
  gists_url: { type: 'string', required: true },
  starred_url: { type: 'string', required: true },
  subscriptions_url: { type: 'string', format: 'uri', required: true },
  organizations_url: { type: 'string', format: 'uri', required: true },
  repos_url: { type: 'string', format: 'uri', required: true },
  events_url: { type: 'string', required: true },
  received_events_url: { type: 'string', format: 'uri', required: true },
  type: { type: 'string', required: true },
  site_admin: { type: 'boolean', required: true },
  name: { type: 'string', nullable: true },
  email: { type: 'string', nullable: true },
  starred_at: { type: 'string' },
  user_view_type: { type: 'string' }
};

export function validateTeam(data) {
  return validateSchema(data, TeamSchema);
}

export function validateTeamFull(data) {
  return validateSchema(data, TeamFullSchema);
}

// Model constructor classes
export class Team {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

export class TeamMember {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

export function validateSchema(data, schema) {
  const errors = [];
  
  for (const [key, rules] of Object.entries(schema)) {
    if (rules.required && !(key in data)) {
      errors.push(`Missing required field: ${key}`);
      continue;
    }
    
    if (key in data) {
      const value = data[key];
      
      if (rules.type && typeof value !== rules.type && !(rules.nullable && value === null)) {
        errors.push(`Invalid type for field ${key}: expected ${rules.type}, got ${typeof value}`);
      }
      
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`Invalid value for field ${key}: must be one of ${rules.enum.join(', ')}`);
      }
      
      if (rules.format === 'uri' && typeof value === 'string' && !isValidUrl(value)) {
        errors.push(`Invalid URI format for field ${key}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}