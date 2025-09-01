#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import inquirer from 'inquirer';
import dotenv from 'dotenv';
import TeamsClient from './client.mjs';
import { formatDate, formatError } from './utils/format.mjs';

dotenv.config();

const program = new Command();
const client = new TeamsClient();

program
  .name('github-teams')
  .description('GitHub Teams CLI - Manage GitHub teams from the command line')
  .version('1.0.0')
  .option('-t, --token <token>', 'GitHub personal access token')
  .option('-o, --org <org>', 'GitHub organization')
  .hook('preAction', (thisCommand) => {
    const token = thisCommand.opts().token || process.env.GITHUB_TOKEN;
    if (!token) {
      console.error(chalk.red('Error: GitHub token is required. Set GITHUB_TOKEN env var or use --token flag'));
      process.exit(1);
    }
    client.token = token;
    client.headers['Authorization'] = `Bearer ${token}`;
  });

const teams = program.command('teams').description('Manage teams');

teams
  .command('list')
  .description('List all teams in an organization')
  .option('--page <page>', 'Page number', '1')
  .option('--per-page <perPage>', 'Items per page', '30')
  .action(async (options) => {
    const spinner = ora('Fetching teams...').start();
    try {
      const org = program.opts().org;
      if (!org) {
        throw new Error('Organization is required. Use -o flag');
      }
      
      const teams = await client.listTeams(org, {
        page: options.page,
        per_page: options.perPage
      });
      
      spinner.succeed('Teams fetched successfully');
      
      if (teams.length === 0) {
        console.log(chalk.yellow('No teams found'));
        return;
      }
      
      const tableData = [
        ['ID', 'Name', 'Slug', 'Privacy', 'Description'],
        ...teams.map(team => [
          team.id,
          team.name,
          team.slug,
          team.privacy,
          team.description || '-'
        ])
      ];
      
      console.log(table(tableData));
    } catch (error) {
      spinner.fail('Failed to fetch teams');
      console.error(chalk.red(formatError(error)));
      process.exit(1);
    }
  });

teams
  .command('create')
  .description('Create a new team')
  .option('--name <name>', 'Team name')
  .option('--description <description>', 'Team description')
  .option('--privacy <privacy>', 'Privacy level (closed/secret)', 'closed')
  .option('--parent <parent>', 'Parent team ID')
  .action(async (options) => {
    const org = program.opts().org;
    if (!org) {
      console.error(chalk.red('Organization is required. Use -o flag'));
      process.exit(1);
    }
    
    let teamData = {};
    
    if (options.name) {
      teamData.name = options.name;
      teamData.description = options.description;
      teamData.privacy = options.privacy;
      if (options.parent) teamData.parent_team_id = options.parent;
    } else {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Team name:',
          validate: input => input.length > 0 || 'Team name is required'
        },
        {
          type: 'input',
          name: 'description',
          message: 'Team description (optional):'
        },
        {
          type: 'list',
          name: 'privacy',
          message: 'Privacy level:',
          choices: ['closed', 'secret'],
          default: 'closed'
        }
      ]);
      teamData = answers;
    }
    
    const spinner = ora('Creating team...').start();
    try {
      const team = await client.createTeam(org, teamData);
      spinner.succeed(`Team '${team.name}' created successfully`);
      console.log(chalk.green(`Team ID: ${team.id}`));
      console.log(chalk.green(`Team Slug: ${team.slug}`));
    } catch (error) {
      spinner.fail('Failed to create team');
      console.error(chalk.red(formatError(error)));
      process.exit(1);
    }
  });

teams
  .command('get <teamSlug>')
  .description('Get team details')
  .action(async (teamSlug) => {
    const spinner = ora('Fetching team details...').start();
    try {
      const org = program.opts().org;
      if (!org) {
        throw new Error('Organization is required. Use -o flag');
      }
      
      const team = await client.getTeam(org, teamSlug);
      spinner.succeed('Team details fetched successfully');
      
      console.log(chalk.bold('\nTeam Details:'));
      console.log(`ID: ${team.id}`);
      console.log(`Name: ${team.name}`);
      console.log(`Slug: ${team.slug}`);
      console.log(`Description: ${team.description || '-'}`);
      console.log(`Privacy: ${team.privacy}`);
      console.log(`Permission: ${team.permission}`);
      console.log(`Members Count: ${team.members_count}`);
      console.log(`Repos Count: ${team.repos_count}`);
      console.log(`Created: ${formatDate(team.created_at)}`);
      console.log(`Updated: ${formatDate(team.updated_at)}`);
      
      if (team.parent) {
        console.log(chalk.bold('\nParent Team:'));
        console.log(`  Name: ${team.parent.name}`);
        console.log(`  Slug: ${team.parent.slug}`);
      }
    } catch (error) {
      spinner.fail('Failed to fetch team details');
      console.error(chalk.red(formatError(error)));
      process.exit(1);
    }
  });

teams
  .command('update <teamSlug>')
  .description('Update team details')
  .option('--name <name>', 'New team name')
  .option('--description <description>', 'New team description')
  .option('--privacy <privacy>', 'New privacy level')
  .action(async (teamSlug, options) => {
    const org = program.opts().org;
    if (!org) {
      console.error(chalk.red('Organization is required. Use -o flag'));
      process.exit(1);
    }
    
    const updateData = {};
    if (options.name) updateData.name = options.name;
    if (options.description) updateData.description = options.description;
    if (options.privacy) updateData.privacy = options.privacy;
    
    if (Object.keys(updateData).length === 0) {
      console.error(chalk.red('No update options provided'));
      process.exit(1);
    }
    
    const spinner = ora('Updating team...').start();
    try {
      const team = await client.updateTeam(org, teamSlug, updateData);
      spinner.succeed(`Team '${team.name}' updated successfully`);
    } catch (error) {
      spinner.fail('Failed to update team');
      console.error(chalk.red(formatError(error)));
      process.exit(1);
    }
  });

teams
  .command('delete <teamSlug>')
  .description('Delete a team')
  .option('--confirm', 'Skip confirmation prompt')
  .action(async (teamSlug, options) => {
    const org = program.opts().org;
    if (!org) {
      console.error(chalk.red('Organization is required. Use -o flag'));
      process.exit(1);
    }
    
    if (!options.confirm) {
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to delete team '${teamSlug}'?`,
          default: false
        }
      ]);
      
      if (!answer.confirm) {
        console.log('Deletion cancelled');
        return;
      }
    }
    
    const spinner = ora('Deleting team...').start();
    try {
      await client.deleteTeam(org, teamSlug);
      spinner.succeed(`Team '${teamSlug}' deleted successfully`);
    } catch (error) {
      spinner.fail('Failed to delete team');
      console.error(chalk.red(formatError(error)));
      process.exit(1);
    }
  });

const members = teams.command('members').description('Manage team members');

members
  .command('list <teamSlug>')
  .description('List team members')
  .option('--role <role>', 'Filter by role (member/maintainer/all)', 'all')
  .action(async (teamSlug, options) => {
    const spinner = ora('Fetching team members...').start();
    try {
      const org = program.opts().org;
      if (!org) {
        throw new Error('Organization is required. Use -o flag');
      }
      
      const members = await client.listTeamMembers(org, teamSlug, {
        role: options.role
      });
      
      spinner.succeed('Members fetched successfully');
      
      if (members.length === 0) {
        console.log(chalk.yellow('No members found'));
        return;
      }
      
      const tableData = [
        ['ID', 'Login', 'Type', 'Site Admin'],
        ...members.map(member => [
          member.id,
          member.login,
          member.type,
          member.site_admin ? 'Yes' : 'No'
        ])
      ];
      
      console.log(table(tableData));
    } catch (error) {
      spinner.fail('Failed to fetch members');
      console.error(chalk.red(formatError(error)));
      process.exit(1);
    }
  });

members
  .command('add <teamSlug> <username>')
  .description('Add a member to team')
  .option('--role <role>', 'Member role (member/maintainer)', 'member')
  .action(async (teamSlug, username, options) => {
    const org = program.opts().org;
    if (!org) {
      console.error(chalk.red('Organization is required. Use -o flag'));
      process.exit(1);
    }
    
    const spinner = ora(`Adding ${username} to team...`).start();
    try {
      await client.addTeamMember(org, teamSlug, username, {
        role: options.role
      });
      spinner.succeed(`User '${username}' added to team successfully`);
    } catch (error) {
      spinner.fail('Failed to add member');
      console.error(chalk.red(formatError(error)));
      process.exit(1);
    }
  });

members
  .command('remove <teamSlug> <username>')
  .description('Remove a member from team')
  .action(async (teamSlug, username) => {
    const org = program.opts().org;
    if (!org) {
      console.error(chalk.red('Organization is required. Use -o flag'));
      process.exit(1);
    }
    
    const spinner = ora(`Removing ${username} from team...`).start();
    try {
      await client.removeTeamMember(org, teamSlug, username);
      spinner.succeed(`User '${username}' removed from team successfully`);
    } catch (error) {
      spinner.fail('Failed to remove member');
      console.error(chalk.red(formatError(error)));
      process.exit(1);
    }
  });

const repos = teams.command('repos').description('Manage team repositories');

repos
  .command('list <teamSlug>')
  .description('List team repositories')
  .action(async (teamSlug) => {
    const spinner = ora('Fetching team repositories...').start();
    try {
      const org = program.opts().org;
      if (!org) {
        throw new Error('Organization is required. Use -o flag');
      }
      
      const repos = await client.listTeamRepos(org, teamSlug);
      
      spinner.succeed('Repositories fetched successfully');
      
      if (repos.length === 0) {
        console.log(chalk.yellow('No repositories found'));
        return;
      }
      
      const tableData = [
        ['ID', 'Name', 'Full Name', 'Private', 'Permissions'],
        ...repos.map(repo => [
          repo.id,
          repo.name,
          repo.full_name,
          repo.private ? 'Yes' : 'No',
          repo.role_name || '-'
        ])
      ];
      
      console.log(table(tableData));
    } catch (error) {
      spinner.fail('Failed to fetch repositories');
      console.error(chalk.red(formatError(error)));
      process.exit(1);
    }
  });

repos
  .command('add <teamSlug> <owner> <repo>')
  .description('Add repository to team')
  .option('--permission <permission>', 'Permission level (pull/push/admin)', 'push')
  .action(async (teamSlug, owner, repo, options) => {
    const org = program.opts().org;
    if (!org) {
      console.error(chalk.red('Organization is required. Use -o flag'));
      process.exit(1);
    }
    
    const spinner = ora(`Adding repository ${owner}/${repo} to team...`).start();
    try {
      await client.addTeamRepo(org, teamSlug, owner, repo, {
        permission: options.permission
      });
      spinner.succeed(`Repository '${owner}/${repo}' added to team successfully`);
    } catch (error) {
      spinner.fail('Failed to add repository');
      console.error(chalk.red(formatError(error)));
      process.exit(1);
    }
  });

repos
  .command('remove <teamSlug> <owner> <repo>')
  .description('Remove repository from team')
  .action(async (teamSlug, owner, repo) => {
    const org = program.opts().org;
    if (!org) {
      console.error(chalk.red('Organization is required. Use -o flag'));
      process.exit(1);
    }
    
    const spinner = ora(`Removing repository ${owner}/${repo} from team...`).start();
    try {
      await client.removeTeamRepo(org, teamSlug, owner, repo);
      spinner.succeed(`Repository '${owner}/${repo}' removed from team successfully`);
    } catch (error) {
      spinner.fail('Failed to remove repository');
      console.error(chalk.red(formatError(error)));
      process.exit(1);
    }
  });

// Only execute CLI when this file is run directly, not when imported
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse(process.argv);
}