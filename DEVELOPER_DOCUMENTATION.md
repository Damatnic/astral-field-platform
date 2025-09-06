# Astral Field AI Suite - Developer Documentation

## 🏗️ Architecture Overview

### System Architecture
The Astral Field AI Suite is built on a modern, scalable architecture designed for high performance and reliability:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
│  Next.js 15.5.2 + TypeScript + Tailwind CSS + shadcn/ui      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                      API Layer                                  │
│  Next.js API Routes + Rate Limiting + Authentication           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                   AI Service Layer                             │
│  Smart Router + Multi-Provider + Caching + Fallbacks          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                    Data Layer                                  │
│     Neon PostgreSQL + Redis Cache + File Storage              │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. AI Service Router (`src/services/ai/aiServiceRouter.ts`)
- **Purpose**: Intelligently routes AI requests to optimal providers
- **Providers**: DeepSeek, Claude, OpenAI, Gemini
- **Features**: Cost optimization, load balancing, failover

```typescript
// Example usage
const router = new AIServiceRouter();
const response = await router.routeRequest({
  prompt: "Analyze this trade",
  taskType: "trade_analysis",
  priority: "high"
});
```

#### 2. Oracle Service (`src/services/ai/oracle.ts`)
- **Purpose**: Central AI intelligence for predictions and recommendations
- **Capabilities**: Player projections, trade analysis, strategic advice
- **Database Integration**: Stores predictions and tracks accuracy

#### 3. ML Pipeline (`src/services/ml/mlPipeline.ts`)
- **Purpose**: Advanced statistical modeling for player performance
- **Models**: Ensemble (Random Forest, XGBoost, Neural Networks)
- **Features**: Weather integration, injury impact, matchup analysis

#### 4. Caching Layer (`src/services/cache/aiCacheManager.ts`)
- **Purpose**: Semantic caching for AI responses
- **Backend**: Redis with intelligent TTL
- **Features**: Similarity matching, automatic invalidation

---

## 🗄️ Database Schema

### Core Tables

#### AI Service Logs
```sql
CREATE TABLE ai_service_logs (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    request_data JSONB NOT NULL,
    response_data JSONB,
    success BOOLEAN NOT NULL,
    response_time_ms INTEGER,
    cost_cents INTEGER,
    accuracy_score DECIMAL(4,3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### User AI Preferences
```sql
CREATE TABLE user_ai_preferences (
    user_id VARCHAR(50) PRIMARY KEY,
    preferences JSONB NOT NULL DEFAULT '{}',
    communication_style VARCHAR(20) DEFAULT 'balanced',
    risk_tolerance DECIMAL(3,2) DEFAULT 0.50,
    learning_history JSONB DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### ML Predictions
```sql
CREATE TABLE ml_predictions (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(20) NOT NULL,
    week INTEGER NOT NULL,
    season INTEGER NOT NULL,
    predicted_points DECIMAL(5,2) NOT NULL,
    confidence_score DECIMAL(4,3) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    features_used JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Full Schema
The complete database schema includes 28+ tables across multiple migration files:
- `001_initial_tables.sql` - Base platform tables
- `020_ai_enhancement_tables.sql` - AI service infrastructure
- `021_ml_pipeline_tables.sql` - Machine learning components
- `026_performance_optimization_tables.sql` - Performance monitoring
- `027_production_monitoring_tables.sql` - System health tracking
- `028_continuous_learning_tables.sql` - Learning and feedback systems

---

## 🔌 API Endpoints

### AI Services

#### Oracle Predictions
```http
POST /api/ai/oracle/predictions
Content-Type: application/json

{
  "playerId": "12345",
  "week": 10,
  "season": 2024,
  "contextualFactors": {
    "weather": { "temperature": 45, "wind": 15, "precipitation": 0.2 },
    "injuries": ["teammate_rb_questionable"],
    "matchup": "vs_weak_pass_defense"
  }
}
```

#### Trade Analysis
```http
POST /api/ai/trade-analysis
Content-Type: application/json

{
  "tradeDetails": {
    "teamA": {
      "playersGiven": ["player1", "player2"],
      "playersReceived": ["player3"]
    },
    "teamB": {
      "playersGiven": ["player3"],
      "playersReceived": ["player1", "player2"]
    }
  },
  "leagueContext": {
    "scoringSettings": "ppr",
    "rosterSize": 16,
    "playoffWeeks": [14, 15, 16, 17]
  }
}
```

#### ML Pipeline
```http
POST /api/ml/predictions
Content-Type: application/json

{
  "players": ["12345", "67890"],
  "week": 10,
  "includeFeatures": true,
  "modelEnsemble": ["random_forest", "xgboost", "neural_net"]
}
```

### Performance Monitoring

#### Load Testing
```http
POST /api/performance/load-testing
Content-Type: application/json

{
  "action": "run_comprehensive_load_test"
}
```

#### System Health
```http
GET /api/performance/load-testing?type=system_health
```

### Continuous Learning

#### AI Validation
```http
POST /api/testing/ai-validation
Content-Type: application/json

{
  "action": "run_comprehensive_validation"
}
```

#### Learning Insights
```http
GET /api/learning/insights?days=30
```

---

## 🧠 AI Service Integration

### Adding New AI Providers

1. **Create Provider Class**
```typescript
// src/services/ai/providers/newProvider.ts
export class NewProvider implements AIProvider {
  async makeRequest(request: AIRequest): Promise<AIResponse> {
    // Implementation
  }
  
  getCostEstimate(request: AIRequest): number {
    // Cost calculation
  }
}
```

2. **Register with Router**
```typescript
// In aiServiceRouter.ts
this.providers.set('newProvider', new NewProvider());
```

3. **Update Configuration**
```typescript
const routingRules = {
  'newProvider': {
    costMultiplier: 1.2,
    accuracyScore: 0.85,
    maxConcurrentRequests: 10
  }
};
```

### Custom AI Tasks

1. **Define Task Type**
```typescript
interface CustomTaskRequest extends AIRequest {
  taskType: 'custom_analysis';
  customParams: {
    dataPoints: string[];
    analysisType: 'comparative' | 'predictive' | 'diagnostic';
  };
}
```

2. **Implement Handler**
```typescript
async handleCustomAnalysis(request: CustomTaskRequest): Promise<AIResponse> {
  const provider = this.selectOptimalProvider(request);
  const prompt = this.buildCustomPrompt(request.customParams);
  
  return await provider.makeRequest({
    ...request,
    prompt
  });
}
```

---

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+ (or Neon database)
- Redis 6+ (optional, for caching)
- API keys for AI providers

### Installation
```bash
git clone <repository-url>
cd astral-field
npm install
```

### Environment Configuration
```bash
cp .env.example .env.local
```

Required environment variables:
```env
# Database
NEON_DATABASE_URL=postgresql://user:pass@host:5432/db

# AI Providers
DEEPSEEK_API_KEY=your_deepseek_key
ANTHROPIC_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Authentication
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000

# Optional
REDIS_URL=redis://localhost:6379
```

### Database Setup
```bash
# Run migrations
npm run db:migrate

# Seed development data (optional)
npm run db:seed
```

### Development Server
```bash
npm run dev
```

### Available Scripts
```json
{
  "dev": "next dev",
  "build": "next build", 
  "start": "next start",
  "lint": "next lint",
  "type-check": "tsc --noEmit",
  "test": "jest",
  "test:watch": "jest --watch",
  "db:migrate": "node scripts/run-migrations.js",
  "db:seed": "node scripts/seed-database.js",
  "demo:setup": "node scripts/one-click-setup.js"
}
```

---

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### AI Accuracy Testing
```bash
curl -X POST http://localhost:3000/api/testing/ai-validation \
  -H "Content-Type: application/json" \
  -d '{"action": "run_comprehensive_validation"}'
```

### Performance Testing
```bash
curl -X POST http://localhost:3000/api/performance/load-testing \
  -H "Content-Type: application/json" \
  -d '{"action": "run_comprehensive_load_test"}'
```

### Test Structure
```
tests/
├── unit/
│   ├── services/ai/
│   ├── services/ml/
│   └── utils/
├── integration/
│   ├── api/
│   └── database/
└── e2e/
    ├── user-flows/
    └── ai-features/
```

---

## 📊 Monitoring & Observability

### Key Metrics

#### System Performance
- Response time (target: <500ms for 95% of requests)
- Throughput (requests per second)
- Error rate (target: <1%)
- Cache hit rate (target: >80%)

#### AI Performance  
- Prediction accuracy (target: >85%)
- Model confidence scores
- Provider cost analysis
- Fallback activation rates

#### User Engagement
- Feature adoption rates
- User satisfaction ratings (1-5 scale)
- Session duration and interaction depth
- AI recommendation acceptance rates

### Monitoring Dashboards

#### Production Monitor Dashboard
Access at: `/admin/performance-dashboard`

Features:
- Real-time system health
- AI service performance metrics
- User engagement analytics
- Alert management

#### AI Validation Dashboard
Access at: `/admin/ai-validation`

Features:
- Accuracy tracking by service
- Model performance comparisons
- Validation test results
- Improvement recommendations

### Alerts Configuration

#### Critical Alerts
- System downtime (immediate)
- AI accuracy drops below 80% (5 min delay)
- Response time >2000ms for >5 minutes
- Error rate >5% for >2 minutes

#### Warning Alerts
- Cache hit rate <70% (15 min delay)
- AI cost exceeds budget (daily)
- User engagement drops >20% (hourly)

---

## 🚀 Deployment

### Production Deployment
```bash
# Build optimized version
npm run build

# Deploy to Vercel
npx vercel --prod

# Or deploy to custom infrastructure
npm run deploy:production
```

### Deployment Checklist

#### Pre-Deployment
- [ ] All tests passing
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] AI provider quotas verified
- [ ] Performance benchmarks met

#### Post-Deployment
- [ ] Health check endpoints responding
- [ ] AI services operational
- [ ] Database connections stable
- [ ] Cache systems functioning
- [ ] Monitoring alerts active

### Infrastructure Requirements

#### Minimum Production Setup
- **CPU**: 2 vCPUs
- **Memory**: 4GB RAM
- **Storage**: 20GB SSD
- **Database**: PostgreSQL with 100GB storage
- **Cache**: Redis with 2GB memory

#### Recommended Production Setup
- **CPU**: 4 vCPUs
- **Memory**: 8GB RAM
- **Storage**: 50GB SSD
- **Database**: PostgreSQL with 500GB storage
- **Cache**: Redis with 8GB memory
- **CDN**: Global content delivery network
- **Load Balancer**: Multi-region setup

---

## 🔒 Security

### Authentication & Authorization
- NextAuth.js for session management
- JWT tokens for API authentication
- Role-based access control (RBAC)
- Rate limiting on all endpoints

### Data Protection
- API key encryption at rest
- Request/response data sanitization
- PII data anonymization
- GDPR compliance measures

### AI Security
- Prompt injection prevention
- Response content filtering
- Cost controls and quotas
- Provider API key rotation

### Security Headers
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options', 
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  }
];
```

---

## 🐛 Troubleshooting

### Common Issues

#### AI Services Not Responding
1. Check API key validity
2. Verify provider quotas
3. Review rate limiting settings
4. Check network connectivity

#### Database Connection Issues  
1. Verify connection string format
2. Check database server status
3. Review connection pool settings
4. Validate SSL configuration

#### Performance Problems
1. Monitor database query performance
2. Check cache hit rates
3. Review AI provider response times
4. Analyze network latency

#### Cache Issues
1. Verify Redis connection
2. Check cache TTL settings
3. Monitor memory usage
4. Review cache invalidation logic

### Debug Mode
```bash
# Enable debug logging
DEBUG=astral:* npm run dev

# AI service debugging
DEBUG=astral:ai:* npm run dev

# Database debugging  
DEBUG=astral:db:* npm run dev
```

### Log Analysis
```bash
# View application logs
tail -f logs/application.log

# View AI service logs
tail -f logs/ai-services.log

# View performance logs
tail -f logs/performance.log
```

---

## 🔄 Contributing

### Development Workflow

1. **Fork and Clone**
```bash
git clone https://github.com/your-username/astral-field.git
cd astral-field
git remote add upstream https://github.com/original/astral-field.git
```

2. **Create Feature Branch**
```bash
git checkout -b feature/new-ai-capability
```

3. **Development**
- Write code following TypeScript best practices
- Add comprehensive tests
- Update documentation
- Follow existing code style

4. **Testing**
```bash
npm test
npm run type-check
npm run lint
```

5. **Submit Pull Request**
- Provide clear description
- Include test results
- Reference related issues

### Code Style Guidelines

#### TypeScript
- Use strict type checking
- Prefer interfaces over types for objects
- Use meaningful variable names
- Add JSDoc comments for public APIs

#### React Components
- Use functional components with hooks
- Implement proper error boundaries
- Follow component composition patterns
- Use TypeScript for all props

#### AI Services
- Implement proper error handling
- Add timeout controls
- Include cost tracking
- Provide fallback mechanisms

### Adding New Features

#### AI Service Features
1. Create service class in `src/services/ai/`
2. Add database tables if needed
3. Create API endpoints
4. Add React components
5. Write comprehensive tests
6. Update documentation

#### ML Model Features
1. Implement in `src/services/ml/`
2. Add training data processing
3. Create prediction endpoints
4. Add model validation
5. Implement A/B testing
6. Monitor accuracy metrics

---

## 📚 Additional Resources

### Documentation Links
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

### AI Provider Documentation
- [DeepSeek API Reference](https://platform.deepseek.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Google AI Studio](https://ai.google.dev/)

### Development Tools
- [Vercel Platform](https://vercel.com/docs)
- [Neon Database](https://neon.tech/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Community
- **GitHub Discussions**: Technical questions and feature requests
- **Discord Server**: Real-time development chat  
- **Twitter**: Updates and announcements
- **Blog**: Deep dives into AI implementation details

---

**For technical support, please open an issue on GitHub or contact the development team.**

*Last updated: [Current Date]*
*Version: 2.0.0*