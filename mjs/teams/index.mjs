import TeamsClient from './client.mjs';
import * as models from './models/index.mjs';

export default TeamsClient;
export { models };

export const createClient = (options = {}) => {
  return new TeamsClient(options);
};

export {
  listTeams,
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  listTeamMembers,
  addTeamMember,
  removeTeamMember,
  getTeamMembership,
  listTeamRepos,
  addTeamRepo,
  removeTeamRepo,
  checkTeamRepo,
  listTeamProjects,
  addTeamProject,
  removeTeamProject,
  checkTeamProject,
  listTeamDiscussions,
  createTeamDiscussion,
  getTeamDiscussion,
  updateTeamDiscussion,
  deleteTeamDiscussion,
  listDiscussionComments,
  createDiscussionComment,
  getDiscussionComment,
  updateDiscussionComment,
  deleteDiscussionComment,
  listChildTeams,
  listTeamsForUser,
  listPendingInvitations
} from './client.mjs';