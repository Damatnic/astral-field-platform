# Astral Field Schema Migration Plan

## Overview
This document outlines the migration plan for consolidating multiple conflicting database schemas in the Astral Field fantasy football platform into a single authoritative schema.

## Current State Analysis

### Identified Schema Files
1. **`db/schema.sql`** (496 lines)
   - Core fantasy football tables
   - Basic chat system
   - Demo data inserts
   - Source: Main development schema

2. **`db/enhanced-chat-schema.sql`** (371 lines)
   - Advanced chat features
   - Direct messaging
   - Live game features
   - Notification system
   - Source: Chat feature enhancement

3. **`neon/schema.sql`** (201 lines)
   - Simplified core tables
   - Stack Auth integration
   - Production-focused structure
   - Source: Neon deployment schema

4. **`src/lib/db/migrations/001_complete_schema.sql`** (557 lines)
   - Comprehensive platform schema
   - All major features included
   - Advanced trading system
   - AI insights and analytics
   - Source: Migration-based schema

5. **Individual Migration Files** (30+ files)
   - Feature-specific table additions
   - Injury tracking system
   - Community forums
   - AI enhancements
   - Performance optimizations

## Key Conflicts Identified

### 1. Table Naming Inconsistencies
- **Players Table**: `players` vs `nfl_players`
- **UUID Generation**: `uuid_generate_v4()` vs `gen_random_uuid()`
- **Timestamp Types**: `TIMESTAMP WITH TIME ZONE` vs `TIMESTAMPTZ`

### 2. Structural Differences
- **User Table**: Stack Auth integration fields vary across schemas
- **Player Stats**: Individual columns vs JSONB structure
- **Scoring Settings**: Different default configurations
- **Chat System**: Basic vs advanced implementation

### 3. Missing Features
- Enhanced chat schema missing core fantasy tables
- Main schema missing advanced AI features  
- Neon schema missing chat and community features
- Migration files contain tables not in main schemas

## Consolidation Strategy

### Phase 1: Schema Unification ✅ COMPLETED
- Created `db/complete-schema.sql` as the single source of truth
- Merged all table definitions with backward compatibility
- Resolved naming conflicts using aliases and compatible structures
- Included all features from all source schemas

### Phase 2: Migration Route Update
- Update API route to use consolidated schema
- Implement progressive migration support
- Add schema version tracking

### Phase 3: Validation and Testing
- Test schema against existing codebase
- Validate all table relationships
- Ensure data compatibility

## Consolidated Schema Features

### Core Tables (All Schemas)
- **users**: Unified with Stack Auth and legacy support
- **leagues**: Complete league management with all settings
- **teams**: Full team structure with standings and stats
- **nfl_teams**: NFL team reference data
- **nfl_players**: Comprehensive player information
- **rosters**: Team-player relationships with history
- **lineups**: Weekly lineup management
- **matchups**: Game scheduling and scoring
- **player_stats**: Flexible stats with multiple formats

### Trading System
- **transactions**: Parent table for all transactions
- **trades**: Complete trading system with AI analysis
- **trade_items**: Detailed trade components
- **waiver_claims**: FAAB and priority-based waivers

### Draft System
- **drafts**: Draft management and configuration
- **draft_picks**: Pick tracking with timing data

### Communication System
- **chat_rooms**: Multi-type chat room support
- **chat_messages**: Advanced messaging with files/GIFs
- **direct_messages**: Private messaging system
- **message_reactions**: Emoji reactions for engagement
- **trash_talk_messages**: Competitive banter system

### Live Features
- **game_plays**: Live game commentary
- **play_reactions**: Real-time fan reactions
- **live_user_reactions**: Game-time engagement
- **league_celebrations**: Victory celebrations

### Analytics and AI
- **ai_insights**: AI-powered recommendations
- **power_rankings**: Team performance analytics
- **chat_analytics**: Communication metrics
- **player_projections**: Statistical forecasting

### Community Features
- **activity_feed**: League activity tracking
- **achievements**: Gamification system
- **notifications**: Multi-channel notification system
- **audit_logs**: Complete action auditing

## Migration Risks and Mitigation

### High Risk Items
1. **Data Loss**: Existing data might not map to new schema
   - **Mitigation**: Comprehensive backup before migration
   - **Rollback**: Keep original schemas as backup

2. **Application Compatibility**: Code expects specific table structures
   - **Mitigation**: Maintained backward compatibility with aliases
   - **Testing**: Comprehensive API testing required

3. **Performance Impact**: Large schema with many indexes
   - **Mitigation**: Optimized indexing strategy implemented
   - **Monitoring**: Performance metrics tracking

### Medium Risk Items
1. **Foreign Key Conflicts**: References between merged schemas
   - **Mitigation**: Careful constraint ordering in migration
   - **Validation**: Database integrity checks

2. **Trigger Conflicts**: Multiple update_at triggers
   - **Mitigation**: Single trigger function for all tables
   - **Testing**: Trigger behavior validation

### Low Risk Items
1. **Minor Data Type Differences**: VARCHAR vs TEXT variations
   - **Mitigation**: Used most flexible types
   - **Impact**: Minimal application changes needed

## Rollback Strategy

### Emergency Rollback (< 1 hour)
1. Stop application services
2. Restore database from pre-migration backup
3. Revert migration route to use original schema
4. Restart application with original configuration

### Planned Rollback (> 1 hour)
1. Export any new data created post-migration
2. Restore original schema structure
3. Migrate compatible data back to original format
4. Update application configuration
5. Validate data integrity

### Rollback Testing
- Create rollback scripts before migration
- Test rollback procedure on development environment
- Document rollback decision criteria

## Data Migration Considerations

### Compatible Tables (Direct Migration)
- users → users (field mapping required)
- leagues → leagues (settings consolidation needed)
- teams → teams (direct migration)
- players/nfl_players → nfl_players (field mapping)

### Complex Migrations Required
- **Chat Data**: Multiple chat tables need consolidation
- **Player Stats**: JSON vs individual columns require transformation
- **Settings**: JSONB structures need merging

### New Tables (No Migration Needed)
- AI insights and analytics tables
- Community forum tables
- Advanced notification tables
- Live game features tables

## Implementation Timeline

### Immediate (Day 1)
- ✅ Create consolidated schema file
- ✅ Document migration plan
- Update migration API route
- Test schema deployment

### Short Term (Week 1)
- Deploy consolidated schema to development
- Test application compatibility
- Update any breaking API calls
- Validate all table relationships

### Medium Term (Week 2-3)
- Deploy to staging environment
- Performance testing and optimization
- User acceptance testing
- Production deployment planning

### Long Term (Month 1)
- Production deployment
- Monitor performance metrics
- Remove deprecated schema files
- Update documentation

## Success Criteria

### Technical Success
- [ ] All existing functionality works with new schema
- [ ] No performance degradation
- [ ] All tests pass
- [ ] Database integrity maintained

### Business Success
- [ ] No user-facing issues during migration
- [ ] All features remain available
- [ ] Improved development velocity
- [ ] Reduced schema maintenance overhead

## Monitoring and Validation

### Pre-Migration Checks
- Backup verification
- Schema validation tests
- Application compatibility tests
- Performance baseline establishment

### Post-Migration Validation
- Data integrity verification
- API functionality testing
- Performance monitoring
- User experience validation

### Long-term Monitoring
- Query performance tracking
- Database size monitoring
- Error rate analysis
- User satisfaction metrics

## Conclusion

The schema consolidation addresses critical technical debt while maintaining full backward compatibility. The unified schema provides a solid foundation for future development and eliminates the confusion of multiple conflicting schema definitions.

The phased approach with comprehensive rollback planning minimizes risk while ensuring business continuity throughout the migration process.