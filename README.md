# 🚀 Astral Field - Elite Fantasy Football Platform

> The future of fantasy football. Built with cutting-edge AI, real-time analytics, and the most intuitive interface in the galaxy.

## ✨ Features

### 🏆 Core Fantasy Football
- **Complete League Management** - Full commissioner tools and league customization
- **Advanced Draft System** - Snake draft with AI assistant and real-time updates
- **Smart Trade Engine** - Automated trade analysis and fairness evaluation
- **FAAB Waiver System** - Budget-based free agent acquisition
- **Real-time Scoring** - Live game updates and scoring with WebSocket integration

### 🤖 AI-Powered Oracle
- **Natural Language Queries** - Ask Oracle any fantasy football question
- **Predictive Analytics** - ML-powered player projections and matchup analysis
- **Trade Recommendations** - AI-driven trade suggestions and analysis
- **Lineup Optimization** - Automated optimal lineup generation
- **Injury Impact Analysis** - Real-time injury assessments and replacements

### 📊 Advanced Analytics
- **Interactive Data Visualizations** - Advanced charts and trend analysis
- **Performance Tracking** - Historical performance and trend analysis
- **Matchup Insights** - Detailed opponent and player matchup data
- **Custom Reports** - Automated league reports in multiple formats

### ⚡ Real-time Features
- **Live Scoring Updates** - Real-time game scores and player statistics
- **Push Notifications** - Instant alerts for trades, waivers, and scores
- **Live Draft Rooms** - Real-time collaborative draft experience
- **WebSocket Integration** - Instant updates across all connected devices

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: TailwindCSS v4
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Data API**: SportsDataIO
- **AI**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **Deployment**: Netlify
- **Real-time**: Supabase Realtime + WebSockets

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account
- SportsDataIO API key

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/astral-field.git
cd astral-field
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Copy the environment template and fill in your API keys:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Sports Data API
NEXT_PUBLIC_SPORTSDATA_API_KEY=your_sportsdata_api_key
SPORTSDATA_SECRET_KEY=your_sportsdata_secret_key

# AI APIs (Server-side only)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_gemini_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Astral Field
```

### 4. Database Setup

The database schema will be automatically created when you first run the application. Supabase migrations are included in the project.

### 5. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📡 SportsDataIO Integration

This project integrates with SportsDataIO for live NFL data. Key features:

### API Endpoints Used
- **Player Stats**: Real-time player statistics and projections
- **Game Scores**: Live scoring updates during NFL games  
- **Injury Reports**: Up-to-date injury information
- **Team Data**: Team statistics, schedules, and roster information
- **Historical Data**: Historical performance data for analytics

### API Configuration
The SportsDataIO API is configured through:
- Environment variables for API keys
- Netlify proxy configuration for secure API calls
- Rate limiting and caching for optimal performance

### Data Updates
- **Live Games**: Updates every 30 seconds during active games
- **Player Stats**: Updated after each game completion
- **Injury Reports**: Updated daily during NFL season
- **Roster Changes**: Real-time updates for trades and signings

## 🌐 Deployment

### Netlify Deployment

This project is optimized for Netlify deployment with included configuration.

#### One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/astral-field)

#### Manual Deployment

1. **Connect Repository**
   ```bash
   # Push to GitHub first
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/astral-field.git
   git push -u origin main
   ```

2. **Configure Netlify**
   - Connect your GitHub repository in Netlify dashboard
   - Build settings are automatically configured via `netlify.toml`
   - Add environment variables in Netlify dashboard

3. **Environment Variables**
   Add all environment variables from `.env.example` to your Netlify site settings.

4. **Deploy**
   - Automatic deployments trigger on every push to main branch
   - Preview deployments created for pull requests

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint

# Type checking
npm run type-check
```

## 🗄️ Database Schema

The application uses Supabase with the following main tables:

- **users** - User profiles and authentication
- **leagues** - League settings and configuration  
- **teams** - Fantasy teams within leagues
- **players** - NFL player database
- **rosters** - Team rosters and player ownership
- **matchups** - Weekly matchup data
- **trades** - Trade proposals and history
- **waivers** - Waiver wire claims
- **messages** - League chat and notifications

## 🎯 Key Features Deep Dive

### Oracle AI Assistant

The Oracle AI system provides intelligent fantasy football insights:

```typescript
// Example Oracle query
const response = await oracle.query({
  question: "Should I start Josh Allen or Lamar Jackson this week?",
  context: {
    leagueId: "league_123",
    teamId: "team_456",
    week: 14
  }
});
```

### Real-time Draft System

Advanced draft functionality with AI assistance:

- Snake draft algorithm with proper turn order
- Real-time participant synchronization
- AI-powered draft recommendations
- Automatic best available player suggestions
- Draft history and analytics

### Trade Analysis Engine

Sophisticated trade evaluation system:

- Multi-factor trade analysis (points, projections, positional value)
- League vote integration
- Trade impact projections
- Historical trade performance tracking

## 🔧 Configuration

### Customization Options

- **League Settings**: Scoring rules, roster sizes, trade policies
- **UI Themes**: Dark/light mode, color customization
- **Notification Preferences**: Push notifications, email alerts
- **AI Settings**: Oracle personality, analysis depth

### Performance Optimization

- **Image Optimization**: Next.js Image component with Supabase CDN
- **Bundle Splitting**: Optimized JavaScript bundling
- **Caching Strategy**: Redis caching for API responses
- **CDN Integration**: Static asset optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🚀 One-Click Deployment

Deploy your own instance of Astral Field to Vercel with a single click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDamatnic%2Fastral-field-platform&env=DATABASE_URL,NEXT_PUBLIC_STACK_PROJECT_ID,NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,STACK_SECRET_SERVER_KEY,NEXT_PUBLIC_SPORTSDATA_API_KEY,OPENAI_API_KEY,ANTHROPIC_API_KEY,ADMIN_SETUP_KEY&envDescription=Required%20environment%20variables%20for%20Astral%20Field&envLink=https%3A%2F%2Fgithub.com%2FDamatnic%2Fastral-field-platform%2Fblob%2Fmain%2F.env.example&project-name=astral-field-platform&repository-name=astral-field-platform)

**Prerequisites:**
- [Neon Database](https://neon.tech) account (free)
- [Stack Auth](https://stack-auth.com) account (free)
- [SportsData.io](https://sportsdata.io) API key (free tier available)
- AI API keys (optional): [OpenAI](https://platform.openai.com), [Anthropic](https://console.anthropic.com)

**After deployment:**
1. Visit `https://your-app.vercel.app/api/setup-users?key=astral2025`
2. Visit `https://your-app.vercel.app/api/setup-demo-league?key=astral2025`
3. Login with code `1234` to test!

📖 **Full deployment guide:** [DEPLOY.md](DEPLOY.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SportsDataIO** - For providing comprehensive NFL data
- **Supabase** - For the amazing backend-as-a-service platform
- **Next.js Team** - For the incredible React framework
- **Vercel** - For hosting and deployment infrastructure

## 📞 Support

- 📧 Email: support@astralfield.com
- 💬 Discord: [Astral Field Community](https://discord.gg/astralfield)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/astral-field/issues)
- 📖 Documentation: [Astral Field Docs](https://docs.astralfield.com)

---

Made with ⚡ by the Astral Field Team