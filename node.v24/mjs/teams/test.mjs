import TeamsClient, { createClient, models } from './index.mjs';
import assert from 'assert';

console.log('Running GitHub Teams API module tests...\n');

console.log('Testing module exports...');
assert(TeamsClient, 'TeamsClient should be exported');
assert(typeof TeamsClient === 'function', 'TeamsClient should be a constructor');
assert(createClient, 'createClient function should be exported');
assert(typeof createClient === 'function', 'createClient should be a function');
assert(models, 'models should be exported');
assert(typeof models === 'object', 'models should be an object');
console.log('✓ Module exports are correct\n');

console.log('Testing client instantiation...');
const client = new TeamsClient({ token: 'test-token' });
assert(client, 'Should create client instance');
assert(client.token === 'test-token', 'Client should store token');
console.log('✓ Client instantiation works\n');

console.log('Testing createClient factory...');
const factoryClient = createClient({ token: 'factory-token' });
assert(factoryClient instanceof TeamsClient, 'Factory should return TeamsClient instance');
assert(factoryClient.token === 'factory-token', 'Factory client should store token');
console.log('✓ Factory function works\n');

console.log('Testing client methods exist...');
const expectedMethods = [
  'listTeams',
  'createTeam', 
  'getTeam',
  'updateTeam',
  'deleteTeam',
  'listTeamMembers',
  'addTeamMember',
  'removeTeamMember',
  'getTeamMembership'
];

for (const method of expectedMethods) {
  assert(typeof client[method] === 'function', `Client should have ${method} method`);
}
console.log('✓ All expected methods exist\n');

console.log('All tests passed! ✓');