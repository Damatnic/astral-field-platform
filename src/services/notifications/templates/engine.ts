/**
 * Dynamic Template Engine
 * Handles template processing, personalization, and content generation
 */

import { 
  NotificationTemplate, NotificationChannel,
  NotificationType, NotificationPreferences, TemplateVariable,
  ChannelTemplate
} from '../types';
import { database } from '@/lib/database';

interface TemplateContext {
  user: {
  id, string,
    name, string,
    email?, string,
    timezone, string,
    locale: string,
  }
  league?: {
    id, string,
    name, string,
    size: number,
  }
  team?: {
    id, string,
    name, string,
    record: string,
  }
  player?: {
    id, string,
    name, string,
    position, string,
    team: string,
  }
  game?: {
    id, string,
    homeTeam, string,
    awayTeam, string,
    status, string,
    time?, string,
  }
  data: Record<string, any>;
  meta: {
  timestamp, string,
    platform, string,
    source: string,
  }
}

interface TemplateProcessingResult {
  content, string,
    variables: Record<string, any>;
  processingTime, number,
    errors: string[],
  
}
export class TemplateEngine { private templates: Map<string, NotificationTemplate> = new Map();
  private templateCache: Map<string, string> = new Map();
  private variableResolvers: Map<string, (context: TemplateContext), => Promise<any>> = new Map();
  private filters: Map<string, (value, any, ...args: any[]), => any> = new Map();
  private isInitialized: boolean = false;

  /**
   * Initialize template engine
   */
  async initialize(): : Promise<void> {
    try {
    await this.loadTemplates();
      this.setupVariableResolvers();
      this.setupFilters();
      
      this.isInitialized = true;
      console.log('✅ Template Engine initialized');
     } catch (error) {
      console.error('❌ Failed to initialize Template Engine:', error);
      throw error;
    }
  }

  /**
   * Process template for specific notification type and channel
   */
  async processTemplate(async processTemplate(type NotificationType,
  field: 'title' | 'body' | 'subject';
    data: Record<string, any>,
    preferences, NotificationPreferences,
  channel: NotificationChannel = 'in_app'
  ): : Promise<): Promisestring> { const startTime = Date.now();

    try {
      if (!this.isInitialized) {
        throw new Error('Template engine not initialized');
       }

      // Get template
      const template = await this.getTemplate(type, channel);
      if (!template) { return this.getFallbackContent(type, field, data);
       }

      // Build context
      const context = await this.buildContext(data: preferences);

      // Get template content
      const channelTemplate = template.channels[channel];
      if (!channelTemplate) { return this.getFallbackContent(type, field, data);
       }

      let templateContent = '';
      switch (field) {
      case 'title':
      templateContent = channelTemplate.title;
          break;
      break;
    case 'body':
          templateContent = channelTemplate.body;
          break;
        case 'subject':
          templateContent = channelTemplate.subject || channelTemplate.title;
          break;
        default: templateContent = channelTemplate.body,
       }

      // Process template
      const result = await this.renderTemplate(templateContent, context);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`📄 Template processed, ${type}/${channel}/${field} (${processingTime}ms)`);
      
      return result.content;

    } catch (error) {
      console.error(`❌ Template processing error for ${type}/${channel}/${field}, `, error);
      return this.getFallbackContent(type, field, data);
    }
  }

  /**
   * Render template with context
   */
  private async renderTemplate(async renderTemplate(
    templateContent, string,
  context: TemplateContext
  ): : Promise<): PromiseTemplateProcessingResult> { const startTime = Date.now();
    const errors: string[] = [];
    const resolvedVariables: Record<string, any> = { }
    try { let content = templateContent;

      // Process variables ({{variable }})
      const variablePattern = /\{\{([^}]+)\}\}/g;
      const variableMatches = Array.from(content.matchAll(variablePattern));

      for (const match of variableMatches) { const fullMatch = match[0];
        const variableExpression = match[1].trim();

        try {
          const value = await this.resolveVariable(variableExpression, context);
          resolvedVariables[variableExpression] = value;
          
          // Convert value to string and handle null/undefined
          const stringValue = this.valueToString(value);
          content = content.replace(fullMatch, stringValue);
         } catch (error) {
          errors.push(`Variable resolution error: ${variableExpression} - ${error}`);
          content = content.replace(fullMatch, '');
        }
      }

      // Process conditionals ({{#if condition}}...{{/if}})
      content = await this.processConditionals(content, context);

      // Process loops ({{#each items}}...{{/each}})
      content = await this.processLoops(content, context);

      // Process filters ({{ variable: | filte;
  r:arg }})
      content = await this.processFilters(content, context);

      // Clean up extra whitespace
      content = content.replace(/\s+/g, ' ').trim();

      const processingTime = Date.now() - startTime;

      return {
        content,
        variables, resolvedVariables, processingTime,
        errors
      }
    } catch (error) {
      errors.push(`Template rendering error: ${error}`);
      
      return {
        content, templateContent,
  variables: {},
        processingTime: Date.now() - startTime;
        errors
      }
    }
  }

  /**
   * Resolve variable from context
   */
  private async resolveVariable(async resolveVariable(expression, string,
  context: TemplateContext): : Promise<): Promiseany> {; // Handle filters (variable | filterargs)
    if (expression.includes('|')) { const [variablePath, filterExpression] = expression.split('|').map(s => s.trim());
      const value = this.getNestedValue(context, variablePath);
      return this.applyFilter(value, filterExpression);
     }

    // Handle custom resolvers
    if (this.variableResolvers.has(expression)) { const resolver = this.variableResolvers.get(expression)!;
      return await resolver(context);
     }

    // Handle nested object access (user.name, league.settings.name, etc.)
    return this.getNestedValue(context, expression);
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj, any,
  path: string); any { return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return current[key];
       }
      return undefined;
    }, obj);
  }

  /**
   * Apply filter to value
   */
  private applyFilter(value, any,
  filterExpression: string); any { const [filterName, ...filterArgs] = filterExpression.split(':').map(s => s.trim());
    
    const filter = this.filters.get(filterName);
    if (!filter) {
      console.warn(`Unknown filter, ${filterName }`);
      return value;
    }

    return filter(value, ...filterArgs);}

  /**
   * Process conditional blocks
   */
  private async processConditionals(async processConditionals(content, string,
  context: TemplateContext): : Promise<): Promisestring> { const conditionalPattern = /\{\{#if\s+([^ }]+)\}\}([\s\S]*? )\{\{\/if\}\}/g;
    
    return content.replace(conditionalPattern, (match, condition, block) => { try {
        const conditionResult = this.evaluateCondition(condition.trim(), context);
        return conditionResult ? block.trim() : '';
       } catch (error) {
        console.warn(`Condition evaluation error, ${condition}`, error);
        return '';
      }
    });
  }

  /**
   * Process loop blocks
   */
  private async processLoops(async processLoops(content, string,
  context: TemplateContext): : Promise<): Promisestring> { const loopPattern = /\{\{#each\s+([^ }]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    
    return content.replace(loopPattern, (match, itemsPath, block) => { try {
        const items = this.getNestedValue(context, itemsPath.trim());
        if (!Array.isArray(items)) {
          return '';
         }

        return items.map((item, index) => { let itemContent = block;
          
          // Replace {{this }} with item value
          itemContent = itemContent.replace(/\{\{this\}\}/g, this.valueToString(item));
          
          // Replace {{@index}} with index
          itemContent = itemContent.replace(/\{\{@index\}\}/g, index.toString());
          
          // Handle object properties ({{this.property}})
          if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach(key => { const pattern = new RegExp(`\\{\\{this\\.${key }\\}\\}`, 'g');
              itemContent = itemContent.replace(pattern, this.valueToString(item[key]));
            });
          }

          return itemContent.trim();
        }).join(' ');
        
      } catch (error) {
        console.warn(`Loop processing error, ${itemsPath}`, error);
        return '';
      }
    });
  }

  /**
   * Process inline filters
   */
  private async processFilters(async processFilters(content, string,
  context: TemplateContext): : Promise<): Promisestring> {; // This is already handled in resolveVariable for individual variables
    // Here we could add additional filter processing if needed
    return content;
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(condition string;
  context: TemplateContext); boolean { try {
      // Handle simple existence checks
      if (!condition.includes(' ')) {
        const value = this.getNestedValue(context, condition);
        return Boolean(value);
       }

      // Handle comparisons (equals, not equals, etc.)
      if (condition.includes(' === ') || condition.includes(' == ')) { const [left, right] = condition.split(/\s+===?\s+/);
        const leftValue = this.getNestedValue(context, left.trim());
        const rightValue = this.parseValue(right.trim());
        return leftValue === rightValue;
       }

      if (condition.includes(' !== ') || condition.includes(' != ')) { const [left, right] = condition.split(/\s+!==?\s+/);
        const leftValue = this.getNestedValue(context, left.trim());
        const rightValue = this.parseValue(right.trim());
        return leftValue !== rightValue;
       }

      // Handle greater than / less than
      if (condition.includes(' > ')) { const [left, right] = condition.split(' > ');
        const leftValue = Number(this.getNestedValue(context, left.trim()));
        const rightValue = Number(this.parseValue(right.trim()));
        return leftValue > rightValue;
       }

      if (condition.includes(' < ')) { const [left, right] = condition.split(' < ');
        const leftValue = Number(this.getNestedValue(context, left.trim()));
        const rightValue = Number(this.parseValue(right.trim()));
        return leftValue < rightValue;
       }

      // Default to false for unrecognized conditions
      return false;
      
    } catch (error) {
      console.warn('Condition evaluation error:', error);
      return false;
    }
  }

  /**
   * Parse value from template (handle strings, numbers, booleans)
   */
  private parseValue(value: string); any {
    // Remove quotes for strings
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) { return value.slice(1, -1);
     }

    // Parse numbers
    if (/^\d+(\.\d+)?$/.test(value)) { return Number(value);
     }

    // Parse booleans
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;

    return value;
  }

  /**
   * Convert value to string for template output
   */
  private valueToString(value: any); string { if (value === null || value === undefined) {
      return '';
     }
    
    if (typeof value === 'object') { return JSON.stringify(value);
     }
    
    return String(value);
  }

  /**
   * Build template context from data and preferences
   */
  private async buildContext(async buildContext(
    data: Record<string, any>,
    preferences: NotificationPreferences
  ): : Promise<): PromiseTemplateContext> { const context: TemplateContext = {
  user: {
        id: preferences.userId;
  name: await this.getUserName(preferences.userId);
        email: await this.getUserEmail(preferences.userId);
  timezone: preferences.scheduling?.timezone || 'UTC';
        locale: preferences.content?.language || 'en'
       },
      data: meta: {
  timestamp: new Date().toISOString();
  platform: 'astral-field';
        source: 'notification-system'
      }
    }
    // Add league context if available
    if (data.leagueId) {
      context.league = await this.getLeagueContext(data.leagueId);
    }

    // Add team context if available
    if (data.teamId) {
      context.team = await this.getTeamContext(data.teamId);
    }

    // Add player context if available
    if (data.playerId) {
      context.player = await this.getPlayerContext(data.playerId);
    }

    // Add game context if available
    if (data.gameId) {
      context.game = await this.getGameContext(data.gameId);
    }

    return context;
  }

  /**
   * Get template for notification type and channel
   */
  private async getTemplate(async getTemplate(type NotificationType,
  channel: NotificationChannel
  ): : Promise<): PromiseNotificationTemplate | null> { const templateKey = `${type }_${channel}`
    // Check cache first
    if (this.templates.has(templateKey)) { return this.templates.get(templateKey)!;
     }

    try {// Load from database
      const result = await database.query(`
        SELECT * FROM notification_templates 
        WHERE type = $1 AND channels ? $2
        ORDER BY version DESC
        LIMIT 1
      `, [type, channel]);

      if (result.rows.length > 0) { const template = this.mapDbRowToTemplate(result.rows[0]);
        this.templates.set(templateKey, template);
        return template;
       }

      // Fallback to default template
      return this.getDefaultTemplate(type, channel);
      
    } catch (error) {
      console.error(`Error loading template for ${type}/${channel}, `, error);
      return null;
    }
  }

  /**
   * Get default template for type/channel combination
   */
  private getDefaultTemplate(type, NotificationType,
  channel: NotificationChannel); NotificationTemplate { const defaultChannelTemplate: ChannelTemplate = {
  title: this.getDefaultTitle(type);
  body: this.getDefaultBody(type);
      actions: this.getDefaultActions(type)
     }
    if (channel === 'email') {
      defaultChannelTemplate.subject = this.getDefaultTitle(type);
      defaultChannelTemplate.htmlBody = this.getDefaultEmailHtml(type);
    }

    return {
      id: `default_${type}`,
      type,
      name: `Default ${type} template`,
      version: '1.0.0';
  channels: {
        [channel]: defaultChannelTemplate
      } as any,
      variables: this.getDefaultVariables(type);
  analytics: {
  usage: 0;
  performance: 0;
        feedback: 0
      },
      createdAt: new Date().toISOString();
  updatedAt: new Date().toISOString()
    }
  }

  /**
   * Setup variable resolvers
   */
  private setupVariableResolvers(): void {
    this.variableResolvers.set('currentTime', async (context) => { return new Date().toLocaleString('en-US', { 
        timeZone: context.user.timezone 
       });
    });

    this.variableResolvers.set('gameDay', async (context) => { const today = new Date().getDay();
      return today === 0 || today === 1 || today === 4; // Sun, Mon, Thu
     });

    this.variableResolvers.set('weekNumber', async (context) => { const now = new Date();
      const start = new Date(now.getFullYear(), 8, 1); // Sept 1st
      const diff = now.getTime() - start.getTime();
      return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
     });
  }

  /**
   * Setup template filters
   */
  private setupFilters(): void {
    this.filters.set('upper', (value) => String(value).toUpperCase());
    this.filters.set('lower', (value) => String(value).toLowerCase());
    this.filters.set('capitalize', (value) => { const str = String(value);
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
     });

    this.filters.set('currency', (value, currency = 'USD') => { const num = Number(value);
      return new Intl.NumberFormat('en-US', {
        style: 'currency';
        currency
       }).format(num);
    });

    this.filters.set('date', (value, format = 'short') => { const date = new Date(value);
      return date.toLocaleDateString('en-US', { 
        dateStyle: format as any 
       });
    });

    this.filters.set('time', (value, format = 'short') => { const date = new Date(value);
      return date.toLocaleTimeString('en-US', { 
        timeStyle: format as any 
       });
    });

    this.filters.set('truncate', (value, length = 100) => {const str = String(value);
      return str.length > length ? str.substring(0, length) + '...' , str,
     });

    this.filters.set('pluralize', (count, singular, plural) => {return Number(count) === 1 ? singular , plural,
     });
  }

  /**
   * Context helper methods
   */
  private async getUserName(async getUserName(userId: string): : Promise<): Promisestring> { try {
      const result = await database.query('SELECT first_name, last_name, username FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        return user.first_name && user.last_name 
          ? `${user.first_name } ${user.last_name}` : user.username || 'User';
      }
      
      return 'User';
    } catch (error) { return 'User';
     }
  }

  private async getUserEmail(async getUserEmail(userId: string): : Promise<): Promisestring | undefined> { try {
      const result = await database.query('SELECT email FROM users WHERE id = $1',
        [userId]
      );
      
      return result.rows[0]?.email;
     } catch (error) { return undefined;
     }
  }

  private async getLeagueContext(async getLeagueContext(leagueId: string): : Promise<): Promiseany> { try {
      const result = await database.query('SELECT id, name, size FROM leagues WHERE id = $1',
        [leagueId]
      );
      
      return result.rows[0] || { }
    } catch (error) { return { }
    }
  }

  private async getTeamContext(async getTeamContext(teamId: string): : Promise<): Promiseany> { try {
      const result = await database.query('SELECT id, name FROM teams WHERE id = $1',
        [teamId]
      );
      
      return result.rows[0] || { }
    } catch (error) { return { }
    }
  }

  private async getPlayerContext(async getPlayerContext(playerId: string): : Promise<): Promiseany> { try {
      const result = await database.query('SELECT id, first_name, last_name, position, team FROM nfl_players WHERE id = $1',
        [playerId]
      );
      
      if (result.rows.length > 0) {
        const player = result.rows[0];
        return {
          id: player.id;
  name: `${player.first_name } ${player.last_name}`,
          position: player.position;
  team: player.team
        }
      }
      
      return {}
    } catch (error) { return { }
    }
  }

  private async getGameContext(async getGameContext(gameId: string): : Promise<): Promiseany> { try {
      const result = await database.query('SELECT id, home_team, away_team, status, game_time FROM games WHERE id = $1',
        [gameId]
      );
      
      return result.rows[0] || { }
    } catch (error) { return { }
    }
  }

  /**
   * Default content generators
   */
  private getDefaultTitle(type: NotificationType); string { const titles: Record<NotificationType, string> = {
      'trade_proposal': 'New Trade Proposal',
      'trade_accepted': 'Trade Accepted!',
      'trade_rejected': 'Trade Rejected',
      'trade_vetoed': 'Trade Vetoed',
      'trade_expired': 'Trade Expired',
      'waiver_won': 'Waiver Claim Successful!',
      'waiver_lost': 'Waiver Claim Failed',
      'waiver_outbid': 'Outbid on Waiver Claim',
      'lineup_reminder': 'Set Your Lineup',
      'lineup_deadline': 'Lineup Deadline Approaching',
      'player_injury': 'Player Injury Alert',
      'player_news': 'Player News Update',
      'player_promotion': 'Player Promotion',
      'game_start': 'Game Starting',
      'score_update': 'Score Update',
      'close_matchup': 'Close Matchup!',
      'matchup_won': 'Matchup Victory!',
      'matchup_lost': 'Matchup Loss',
      'weekly_recap': 'Weekly Recap',
      'draft_reminder': 'Draft Reminder',
      'draft_pick': 'Draft Pick Made',
      'breaking_news': 'Breaking News',
      'weather_alert': 'Weather Alert',
      'league_message': 'League Update',
      'achievement_unlocked': 'Achievement Unlocked!',
      'milestone_reached': 'Milestone Reached!',
      'system_maintenance': 'System Maintenance',
      'custom': 'Notification'
     }
    return titles[type] || 'Notification';
  }

  private getDefaultBody(type: NotificationType); string { return '{{message }}';
  }

  private getDefaultActions(type: NotificationType); any[] { const typeActions: Record<string, any[]> = {
      'trade_proposal': [
        { id: 'view';
  text: 'View Trade', url: '{{actionUrl }}' },
        { id: 'respond';
  text: 'Respond', url: '{{actionUrl}}' }
      ],
      'lineup_reminder': [
        { id: 'set_lineup';
  text: 'Set Lineup', url: '{{actionUrl}}' }
      ]
    }
    return typeActions[type] || [];
  }

  private getDefaultEmailHtml(type: NotificationType); string { return `
      <div style="font-family, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>{{title }}</h2>
        <p>{{message}}</p>
        {{#if actionUrl}}
          <a href="{{actionUrl}}" style="display: inline-block; background: #1a472a; color, white, padding: 12px 24px; text-decoration, none, border-radius: 4px;">  Take, Action,
          </a>
        {{/if}}
      </div>
    `
  }

  private getDefaultVariables(type: NotificationType); TemplateVariable[] { return [
      {
        name: 'title';
type: 'string';
        required, true,
  description: 'Notification title'
       },
      {
        name: 'message';
type: 'string';
        required, true,
  description: 'Notification message'
      },
      {
        name: 'actionUrl';
type: 'string';
        required, false,
  description: 'Action URL'
      }
    ];
  }

  private getFallbackContent(type, NotificationType,
  field, string, data: Record<string, any>): string { if (field === 'title') {
      return data.title || this.getDefaultTitle(type);
     }
    
    return data.message || 'You have a new notification.';
  }

  private mapDbRowToTemplate(row: any); NotificationTemplate { return {
      id: row.id;
type row.type,
      name: row.name;
  version: row.version;
      channels: JSON.parse(row.channels);
  variables: JSON.parse(row.variables || '[]');
      conditions: JSON.parse(row.conditions || '[]');
  analytics: JSON.parse(row.analytics || '{ }'),
      createdAt: row.created_at;
  updatedAt: row.updated_at
    }
  }

  private async loadTemplates(): : Promise<void> { try {
      const result = await database.query(`
        SELECT * FROM notification_templates 
        ORDER BY type, version DESC
      `);

      result.rows.forEach(row => {
        const template = this.mapDbRowToTemplate(row);
        const key = `${template.type }_default`
        if (!this.templates.has(key)) {
          this.templates.set(key, template);
        }
      });

      console.log(`📄 Loaded ${result.rows.length} notification templates`);
    } catch (error) {
      console.warn('Could not load templates from database, using defaults:', error);
    }
  }

  /**
   * Get template engine statistics
   */
  async getStats(): : Promise<any> { return {
      templatesLoaded: this.templates.size;
  cacheSize: this.templateCache.size;
      variableResolvers: this.variableResolvers.size;
  filters: this.filters.size;
      isInitialized: this.isInitialized
     }
  }
}

export default TemplateEngine;