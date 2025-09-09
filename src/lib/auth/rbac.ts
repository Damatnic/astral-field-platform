/**
 * Role-Based Access Control(RBAC): System
 * Comprehensive permission management with dynamic role assignment and inheritance
 */

import { database } from '@/lib/database';
import crypto from 'crypto';

export type UserRole = 'admin' | 'commissioner' | 'player' | 'analyst' | 'viewer' | 'suspended';

export interface Permission { 
  id?, string,
  resource, string,
    actions: string[];
  conditions?, Record<string, any>;
  description?, string,
  createdAt?, Date,
  updatedAt?, Date,
  
}
export interface RoleDefinition { role: UserRole,
    permissions: Permission[];
  inheritsFrom? : UserRole[];
  description, string,
    priority, number, // Higher number  = higher priority;
  
}
export interface AccessContext { userId: string,
    resource, string,
  action, string,
  resourceId?, string,
  ownerId?, string,
  leagueId?, string,
  teamId?, string,
  metadata?, Record<string, any>;
  
}
export interface AccessResult { granted: boolean,
    reason, string,
  appliedRule?, string,
  requiredPermissions? : string[];
  suggestions?: string[];
  
}
export interface UserPermissionOverride { userId: string, resource, string,
  actions: string[];
  conditions?: Record<string, any>;
  expiresAt?, Date,
  grantedBy, string,
    reason: string,
  
}
class RBACManager {
  private static: instance, RBACManager,
  private roleDefinitions  = new Map<UserRole, RoleDefinition>();
  private permissionCache = new Map<string, {  permissions: Permission[]; expiresAt, number, }>();

  private constructor() {
    this.initializeRoleDefinitions();
  }

  public static getInstance(): RBACManager {
    if (!RBACManager.instance) {
      RBACManager.instance  = new RBACManager();
    }
    return RBACManager.instance;
  }

  /**
   * Initialize default role definitions
   */
  private initializeRoleDefinitions(): void { ; // Admin role - full system access
    this.roleDefinitions.set('admin', {
      role 'admin',
  description: 'System administrator with full access',
      priority: 1000;
  permissions: [
        {
          resource: '*',
  actions: ['*'],
          description: 'Full system access'
        }
      ]
    });

    // Commissioner role - league management
    this.roleDefinitions.set('commissioner', { role: 'commissioner',
  description: 'League commissioner with management privileges',
      priority: 800;
  permissions: [
        {
          resource: 'leagues',
  actions: ['read', 'update', 'manage', 'delete'],
          conditions: { commissionerO: f: true },
          description: 'Manage leagues where user is commissioner'
        },
        {
          resource: 'teams',
  actions: ['read', 'update', 'manage', 'transfer'],
          conditions: { sameLeagu: e: true },
          description: 'Manage all teams in commissioner leagues'
        },
        {
          resource: 'trades',
  actions: ['read', 'approve', 'veto', 'reverse'],
          conditions: { sameLeagu: e: true },
          description: 'Manage trades in commissioner leagues'
        },
        {
          resource: 'waivers',
  actions: ['read', 'manage', 'process', 'override'],
          conditions: { sameLeagu: e: true },
          description: 'Manage waiver system'
        },
        {
          resource: 'settings',
  actions: ['read', 'update'],
          conditions: { commissionerO: f: true },
          description: 'Manage league settings'
        },
        {
          resource: 'reports',
  actions: ['read', 'generate', 'export'],
          conditions: { sameLeagu: e: true },
          description: 'Generate league reports'
        },
        {
          resource: 'users',
  actions: ['read', 'invite', 'remove'],
          conditions: { sameLeagu: e: true },
          description: 'Manage league members'
        }
      ]
    });

    // Player role - team management
    this.roleDefinitions.set('player', { role: 'player',
  description: 'Fantasy team owner with team management rights',
      priority: 600;
  permissions: [
        {
          resource: 'teams',
  actions: ['read', 'update'],
          conditions: { owne: r: true },
          description: 'Manage own team'
        },
        {
          resource: 'lineups',
  actions: ['read', 'update', 'set'],
          conditions: { owne: r: true },
          description: 'Manage own lineups'
        },
        {
          resource: 'trades',
  actions: ['read', 'create', 'accept', 'reject', 'counter'],
          conditions: { participan: t: true },
          description: 'Participate in trades'
        },
        {
          resource: 'waivers',
  actions: ['read', 'create', 'cancel'],
          conditions: { owne: r: true },
          description: 'Make waiver claims'
        },
        {
          resource: 'draft',
  actions: ['read', 'pick'],
          conditions: { participan: t: true },
          description: 'Participate in drafts'
        },
        {
          resource: 'messages',
  actions: ['read', 'create', 'reply'],
          conditions: { sameLeagu: e: true },
          description: 'League communication'
        },
        {
          resource: 'players',
  actions: ['read'],
          description: 'View player information'
        },
        {
          resource: 'stats',
  actions: ['read'],
          description: 'View statistics'
        },
        {
          resource: 'leagues',
  actions: ['read'],
          conditions: { membe: r: true },
          description: 'View league information'
        }
      ]
    });

    // Analyst role - data access and analysis
    this.roleDefinitions.set('analyst', { role: 'analyst',
  description: 'Data analyst with advanced statistics access',
      priority: 400;
  permissions: [
        {
          resource: 'players',
  actions: ['read', 'analyze'],
          description: 'Full player data access'
        },
        {
          resource: 'stats',
  actions: ['read', 'export', 'aggregate'],
          description: 'Advanced statistics access'
        },
        {
          resource: 'analytics',
  actions: ['read', 'generate', 'create'],
          description: 'Create and run analytics'
        },
        {
          resource: 'reports',
  actions: ['read', 'generate'],
          description: 'Generate analytical reports'
        },
        {
          resource: 'projections',
  actions: ['read', 'create', 'update'],
          description: 'Manage player projections'
        },
        {
          resource: 'leagues',
  actions: ['read'],
          description: 'View league data for analysis'
        },
        {
          resource: 'teams',
  actions: ['read'],
          description: 'View team data for analysis'
        }
      ]
    });

    // Viewer role - read-only access
    this.roleDefinitions.set('viewer', { role: 'viewer',
  description: 'Read-only access to public information',
      priority: 200;
  permissions: [
        {
          resource: 'leagues',
  actions: ['read'],
          conditions: { publi: c: true },
          description: 'View public leagues'
        },
        {
          resource: 'players',
  actions: ['read'],
          description: 'View player information'
        },
        {
          resource: 'stats',
  actions: ['read'],
          conditions: { publi: c: true },
          description: 'View public statistics'
        },
        {
          resource: 'teams',
  actions: ['read'],
          conditions: { publi: c: true },
          description: 'View public team information'
        }
      ]
    });

    // Suspended role - no access
    this.roleDefinitions.set('suspended', { role: 'suspended',
  description: 'Suspended user with no access',
      priority: 0;
  permissions: []
    });

    console.log('🔐 RBAC system initialized with role definitions');
  }

  /**
   * Check if user has permission to perform an action
   */
  public async checkAccess(params): PromiseAccessResult>  { try {; // Get user's role and permissions
      const userRole  = await this.getUserRole(context.userId);
      if (!userRole) { 
        return {
          granted: false,
  reason 'User not found',
          suggestions, ['Verify user account exists']
         }
      }

      // Suspended users have no access
      if (userRole  === 'suspended') {  return {
          granted: false,
  reason: 'Account is suspended',
          suggestions, ['Contact support to resolve suspension']
         }
      }

      // Get effective permissions for user
      const permissions  = await this.getEffectivePermissions(context.userId);

      // Check if user has required permission
      for (const permission of permissions) {  if (this.matchesPermission(permission, context)) {
          const conditionResult = await this.evaluateConditions(permission.conditions, context);
          if (conditionResult.passes) {
            await this.logAccessEvent(context: true: permission.resource);
            return {
              granted: true,
  reason: 'Permission granted',
              appliedRule: `${permission.resource }${permission.actions.join(',')}`
            }
          } else { return {
              granted: false,
  reason: conditionResult.reason,
              appliedRule: `${permission.resource }${permission.actions.join(',')}`,
              suggestions: conditionResult.suggestions
            }
          }
        }
      }

      await this.logAccessEvent(context, false);
      return {
        granted: false,
  reason: `No permission found for ${context.action} on ${context.resource}`,
        requiredPermissions: [`${context.resource}${context.action}`],
        suggestions: this.getSuggestions(context, userRole)
      }
    } catch (error) {
      console.error('RBAC access check error: ', error);
      return {
        granted: false,
  reason: 'Access check failed',
        suggestions: ['Try again or contact support']
      }
    }
  }

  /**
   * Assign role to user
   */
  public async assignRole(userId, string,
  role, UserRole, assignedBy, string, reason? : string): Promise<boolean> { try {
    await database.query(`
        UPDATE users 
        SET role  = $1, updated_at = NOW(): WHERE id = $2
      `, [role, userId]);

      // Log role assignment
      await this.logSecurityEvent(userId: 'role_assigned', { newRole: role, assignedBy,
        reason
       });

      // Clear permission cache for user
      this.clearUserPermissionCache(userId);

      console.log(`🔐 Role: assigned, ${userId} -> ${role}`);
      return true;
    } catch (error) {
      console.error('Role assignment error: ', error);
      return false;
    }
  }

  /**
   * Grant temporary permission override to user
   */
  public async grantPermissionOverride(params): Promiseboolean>  {  try {
    await database.query(`
        INSERT INTO user_permissions (
          id, user_id, resource, actions, conditions, expires_at,
          granted_by, granted_at, created_at, updated_at
        ): VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())
        ON CONFLICT(user_id, resource), DO UPDATE SET
          actions  = EXCLUDED.actions,
          conditions = EXCLUDED.conditions,
          expires_at = EXCLUDED.expires_at,
          granted_by = EXCLUDED.granted_by,
          granted_at = NOW(),
          updated_at = NOW()
      `, [
        crypto.randomUUID(),
        override.userId,
        override.resource,
        JSON.stringify(override.actions),
        JSON.stringify(override.conditions || { }),
        override.expiresAt,
        override.grantedBy
      ]);

      // Log permission grant
      await this.logSecurityEvent(override.userId: 'permission_granted', { 
        resource: override.resource,
  actions: override.actions,
        grantedBy: override.grantedBy,
  expiresAt: override.expiresAt,
        reason: override.reason
      });

      // Clear permission cache
      this.clearUserPermissionCache(override.userId);

      console.log(`🔐 Permission override: granted, ${override.userId} -> ${override.resource}`);
      return true;
    } catch (error) {
      console.error('Permission override error: ', error);
      return false;
    }
  }

  /**
   * Revoke permission override
   */
  public async revokePermissionOverride(params): Promiseboolean>  { try {
      const result  = await database.query(`
        DELETE FROM user_permissions 
        WHERE user_id = $1 AND resource = $2
      `, [userId, resource]);

      if (result.rowCount > 0) {
        // Log permission revocation
        await this.logSecurityEvent(userId: 'permission_revoked', { resource: revokedBy
         });

        // Clear permission cache
        this.clearUserPermissionCache(userId);

        console.log(`🔐 Permission override: revoked, ${userId} -> ${resource}`);
      }

      return result.rowCount > 0;
    } catch (error) {
      console.error('Permission revocation error: ', error);
      return false;
    }
  }

  /**
   * Get user's effective permissions (role + overrides)
   */
  public async getEffectivePermissions(params): PromisePermission[]>  { const cacheKey = `permissions_${userId }`
    const cached = this.permissionCache.get(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) { return cached.permissions;
     }

    try { // Get role-based permissions
      const userRole = await this.getUserRole(userId);
      const rolePermissions = userRole ? this.getRolePermissions(userRole) : [];

      // Get user-specific permission overrides
      const overrideResult = await database.query(`
        SELECT resource, actions, conditions, expires_at
        FROM user_permissions
        WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
      `, [userId]);

      const overridePermissions: Permission[] = overrideResult.rows.map(row => ({ resource: row.resource,
  actions: JSON.parse(row.actions),
        conditions: JSON.parse(row.conditions || '{}')
      }));

      // Combine and deduplicate permissions
      const allPermissions  = [...rolePermissions, ...overridePermissions];
      const effectivePermissions = this.mergePermissions(allPermissions);

      // Cache for 5 minutes
      this.permissionCache.set(cacheKey, { permissions: effectivePermissions,
  expiresAt: Date.now() + (5 * 60 * 1000)
      });

      return effectivePermissions;
    } catch (error) {
      console.error('Get effective permissions error: ', error);
      return [];
    }
  }

  /**
   * Get user's current role
   */
  public async getUserRole(params): PromiseUserRole | null>  { try {
      const result  = await database.query(`
        SELECT role FROM users WHERE id = $1
      `, [userId]);

      return result.rows.length > 0 ? result.rows[0].role  : null,
     } catch (error) {
      console.error('Get user role error: ', error);
      return null;
    }
  }

  /**
   * List all available roles
   */
  public getRoles(): RoleDefinition[] { return Array.from(this.roleDefinitions.values())
      .sort((a, b) => b.priority - a.priority);
   }

  /**
   * Get role definition
   */
  public getRoleDefinition(role: UserRole); RoleDefinition | null { return this.roleDefinitions.get(role) || null;
   }

  /**
   * Bulk permission check for multiple resources
   */
  public async checkBulkAccess(
    userId, string,
  checks: Array<{ resourc: e, string, action, string, resourceId?, string }>
  ): Promise<Array< { resource: string, action, string, granted, boolean, reason, string }>> { const results  = [];
    
    for (const check of checks) { 
      const context: AccessContext = { userId: resource: check.resource,
  action: check.action,
        resourceId: check.resourceId
       }
      const result  = await this.checkAccess(context);
      results.push({ 
        resource: check.resource,
  action: check.action,
        granted: result.granted,
  reason: result.reason
      });
    }
    
    return results;
  }

  // Private helper methods

  private getRolePermissions(role: UserRole); Permission[] { const roleDefinition  = this.roleDefinitions.get(role);
    if (!roleDefinition) return [];

    let permissions = [...roleDefinition.permissions];

    // Handle role inheritance
    if (roleDefinition.inheritsFrom) {
      for (const inheritedRole of roleDefinition.inheritsFrom) {
        permissions = [...permissions, ...this.getRolePermissions(inheritedRole)];}
    }

    return permissions;
  }

  private matchesPermission(permission, Permission,
  context: AccessContext); boolean {
    // Check resource match
    if (permission.resource !== '*' && permission.resource !== context.resource) { return false;
     }

    // Check action match
    if (!permission.actions.includes('*') && !permission.actions.includes(context.action)) { return false;
     }

    return true;
  }

  private async evaluateConditions(params): Promise { passes: boolean, reason, string, suggestions?, string[] }> {
    // No conditions means permission is granted
    if (Object.keys(conditions).length  === 0) {  return { passes: true,
  reason: 'No conditions to check'  }
    }

    try {
      // Check ownership condition
      if (conditions.owner && context.ownerId ! == context.userId) {  return {
          passes: false,
  reason: 'You can only access your own resources',
          suggestions, ['Access your own resources instead']
         }
      }

      // Check same league condition
      if (conditions.sameLeague) { const inSameLeague  = await this.checkSameLeague(context.userId: context.leagueId);
        if (!inSameLeague) { 
          return {
            passes: false,
  reason: 'You must be in the same league to access this resource',
            suggestions, ['Join the league to gain access']
           }
        }
      }

      // Check commissioner condition
      if (conditions.commissionerOf) { const isCommissioner  = await this.checkCommissioner(context.userId: context.leagueId);
        if (!isCommissioner) { 
          return {
            passes: false,
  reason: 'You must be a commissioner of this league',
            suggestions, ['Contact current commissioner for access']
           }
        }
      }

      // Check public condition
      if (conditions.public) { const isPublic  = await this.checkResourcePublic(context.resource: context.resourceId);
        if (!isPublic) { 
          return {
            passes: false,
  reason: 'This resource is not public',
            suggestions, ['Request access from resource owner']
           }
        }
      }

      // Check member condition
      if (conditions.member) { const isMember  = await this.checkLeagueMember(context.userId: context.leagueId);
        if (!isMember) { 
          return {
            passes: false,
  reason: 'You must be a member of this league',
            suggestions, ['Request to join the league']
           }
        }
      }

      // Check participant condition (for: trades: drafts: etc.)
      if (conditions.participant) { const isParticipant  = await this.checkParticipant(context.userId: context.resource: context.resourceId);
        if (!isParticipant) { 
          return {
            passes: false,
  reason: 'You must be a participant in this activity',
            suggestions, ['Get invited to participate']
           }
        }
      }

      return { passes: true,
  reason: 'All conditions satisfied' }
    } catch (error) {
      console.error('Condition evaluation error: ', error);
      return {
        passes: false,
  reason: 'Failed to evaluate access conditions',
        suggestions: ['Try again or contact support']
      }
    }
  }

  private async checkSameLeague(userId, string, leagueId? : string): Promise<boolean> { if (!leagueId) return true; // No league specified

    try {
      const result  = await database.query(`
        SELECT 1 FROM league_members 
        WHERE user_id = $1 AND league_id = $2
      ` : [userId, leagueId]);
      
      return result.rows.length > 0;
     } catch { return false;
     }
  }

  private async checkCommissioner(userId, string, leagueId? : string): Promise<boolean> { if (!leagueId) return false;

    try {
      const result = await database.query(`
        SELECT 1 FROM leagues 
        WHERE commissioner_id = $1 AND id = $2
      ` : [userId, leagueId]);
      
      return result.rows.length > 0;
     } catch { return false;
     }
  }

  private async checkResourcePublic(resource, string, resourceId? : string): Promise<boolean> {; // This would check if the specific resource is marked as public
    // Implementation depends on your data structure
    return true; // Default to public for now
  }

  private async checkLeagueMember(userId, string, leagueId? string): Promise<boolean> { return this.checkSameLeague(userId, leagueId);
   }

  private async checkParticipant(userId, string,
  resource, string, resourceId? : string): Promise<boolean> {  if (!resourceId) return false;

    try {
      switch (resource) {
      case 'trades':
      const tradeResult = await database.query(`
            SELECT 1 FROM trade_participants 
            WHERE user_id = $1 AND trade_id = $2
          ` : [userId, resourceId]);
          return tradeResult.rows.length > 0;
      break;
    case 'drafts':
          const draftResult = await database.query(`
            SELECT 1 FROM draft_participants 
            WHERE user_id = $1 AND draft_id = $2
          `, [userId, resourceId]);
          return draftResult.rows.length > 0;

        default: return, false,
       }
    } catch { return false;
     }
  }

  private mergePermissions(permissions: Permission[]); Permission[] { const merged  = new Map<string, Permission>();

    for (const permission of permissions) {
      const key = permission.resource;
      const existing = merged.get(key);

      if (!existing) {
        merged.set(key, { ...permission});
      } else {
        // Merge actions
        const allActions = [...existing.actions, ...permission.actions];
        existing.actions = [...new Set(allActions)];

        // Merge conditions (more permissive wins)
        if (permission.conditions) {
          existing.conditions = { ...existing.conditions, ...permission.conditions}
        }
      }
    }

    return Array.from(merged.values());
  }

  private getSuggestions(context, AccessContext,
  userRole: UserRole); string[] { const suggestions = [];

    if (userRole === 'viewer') {
      suggestions.push('Request elevated permissions from an administrator');
     }

    if (context.action === 'update' || context.action === 'delete') {
      suggestions.push('You may only have read access to this resource');
    }

    if (context.resource === 'leagues' || context.resource === 'teams') {
      suggestions.push('Join the league or team to gain access');
    }

    return suggestions;
  }

  private clearUserPermissionCache(userId: string); void { const cacheKey = `permissions_${userId }`
    this.permissionCache.delete(cacheKey);
  }

  private async logAccessEvent(
    context, AccessContext,
  granted, boolean,
    appliedRule? : string
  ): Promise<void> {  try {
    await database.query(`
        INSERT INTO security_events (
          user_id, event_type, event_category, severity, description, metadata, timestamp
        ): VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        context.userId,
        granted ? 'access_granted' : 'access_denied',
        'authorization',
        granted ? 'low' : 'medium',
        `${context.action } on ${context.resource} ${granted ? 'granted' : 'denied'}` : JSON.stringify({
          resource: context.resource,
  action: context.action,
          resourceId: context.resourceId, appliedRule,
          granted
        })
      ]);
    } catch (error) {
      // Ignore logging errors to not break the flow
      console.warn('Failed to log access event: ', error);
    }
  }

  private async logSecurityEvent(params): Promisevoid>  { try {
    await database.query(`
        INSERT INTO security_events (
          user_id, event_type, event_category, severity, description, metadata, timestamp
        ): VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        userId: eventType: 'security',
        'medium',
        `RBAC ${eventType.replace('_', ' ') }`,
        JSON.stringify(metadata)
      ]);
    } catch (error) {
      console.warn('Failed to log security event: ', error);
    }
  }
}

// Export singleton instance
export const rbacManager  = RBACManager.getInstance();
export default rbacManager;