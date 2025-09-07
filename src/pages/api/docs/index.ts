import type { NextApiRequest, NextApiResponse } from 'next'

const API_DOCUMENTATION = {
  version: "1.0.0",
  title: "Astral Field Analytics API",
  description: "Comprehensive fantasy football analytics and AI-powered insights API",
  baseUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  
  endpoints: {
    analytics: {
      "/api/analytics/performance-attribution": {
        methods: ["GET", "POST"],
        description: "Get performance attribution analysis for fantasy football decisions",
        parameters: {
          leagueId: {
            type: "string",
            required: false,
            description: "League identifier for specific league analysis"
          }
        },
        responses: {
          200: {
            description: "Performance attribution data",
            example: {
              attribution: [
                { factor: "Roster Efficiency", impact: 0.18 },
                { factor: "Matchup Exploitation", impact: 0.12 },
                { factor: "Injuries", impact: -0.11 }
              ],
              totalImpact: 0.19,
              mode: "mock",
              metadata: {
                leagueId: "demo",
                period: "season-to-date",
                generatedAt: "2025-09-07T14:30:00.000Z"
              }
            }
          }
        },
        caching: "5 minutes",
        monitoring: true
      },

      "/api/analytics/season-strategy": {
        methods: ["GET", "POST"],
        description: "Get AI-powered season strategy recommendations",
        parameters: {
          leagueId: {
            type: "string",
            required: false,
            description: "League identifier"
          },
          teamId: {
            type: "string",
            required: false,
            description: "Team identifier for personalized recommendations"
          }
        },
        responses: {
          200: {
            description: "Season strategy recommendations",
            example: {
              recommendations: [
                {
                  action: "Target RB handcuffs on waivers",
                  rationale: "Your RB2 spot shows injury risk based on recent game logs",
                  expectedImpact: "medium"
                }
              ],
              currentWeek: 3,
              mode: "mock"
            }
          }
        },
        caching: "10 minutes",
        monitoring: true
      },

      "/api/analytics/comparative-analysis": {
        methods: ["GET", "POST"],
        description: "Compare league performance and get competitive insights",
        parameters: {
          leagueId: {
            type: "string",
            required: false,
            description: "League identifier for comparison analysis"
          }
        },
        responses: {
          200: {
            description: "Comparative analysis data",
            example: {
              leagueMetrics: {
                averageScore: 112.5,
                standardDeviation: 23.8,
                totalTeams: 12
              },
              teamRankings: [
                { teamName: "Team Alpha", score: 135.2, rank: 1 }
              ],
              insights: [
                "League scoring is 15% higher than average"
              ],
              mode: "mock"
            }
          }
        },
        caching: "15 minutes",
        monitoring: true
      }
    },

    ai: {
      "/api/ai/real-time-sentiment": {
        methods: ["GET", "POST"],
        description: "Real-time sentiment analysis for fantasy football players and trends",
        parameters: {
          action: {
            type: "string",
            required: true,
            enum: ["start_monitoring", "stop_monitoring", "get_trends", "get_alerts"],
            description: "Action to perform"
          },
          platform: {
            type: "string",
            required: false,
            enum: ["twitter", "reddit", "both"],
            description: "Social media platform to monitor"
          },
          players: {
            type: "array",
            required: false,
            description: "List of player names to monitor"
          }
        },
        responses: {
          200: {
            description: "Sentiment analysis results",
            example: {
              success: true,
              trends: [
                {
                  player: "Josh Allen",
                  averageScore: 0.75,
                  direction: "up"
                }
              ],
              type: "trends"
            }
          }
        },
        monitoring: true
      },

      "/api/ai/multimodal-analysis": {
        methods: ["POST"],
        description: "AI-powered multimodal analysis of fantasy football data, images, and text",
        parameters: {
          type: {
            type: "string",
            required: true,
            enum: ["player_analysis", "matchup_preview", "injury_assessment"],
            description: "Type of analysis to perform"
          },
          content: {
            type: "object",
            required: true,
            description: "Content data including text, images, or structured data"
          }
        },
        responses: {
          200: {
            description: "Multimodal analysis results",
            example: {
              success: true,
              analysis: {
                summary: "Player shows strong upside potential",
                confidence: 0.87,
                factors: ["Recent usage trends", "Matchup advantages"]
              },
              type: "player_analysis"
            }
          }
        },
        monitoring: true
      }
    },

    health: {
      "/api/health": {
        methods: ["GET"],
        description: "Overall system health check",
        responses: {
          200: {
            description: "System health status",
            example: {
              status: "healthy",
              timestamp: "2025-09-07T14:30:00.000Z",
              version: "1.0.0"
            }
          }
        }
      },

      "/api/health/database": {
        methods: ["GET"],
        description: "Database connection health check",
        responses: {
          200: {
            description: "Database health status",
            example: {
              status: "healthy",
              details: {
                connected: true,
                responseTimeMs: 45
              }
            }
          }
        }
      },

      "/api/health/cache": {
        methods: ["GET"],
        description: "Cache system health check",
        responses: {
          200: {
            description: "Cache health status",
            example: {
              status: "healthy",
              cache: {
                type: "in-memory",
                health: "healthy",
                operations: {
                  set: true,
                  get: true,
                  delete: true
                }
              }
            }
          }
        }
      }
    },

    admin: {
      "/api/admin/monitoring": {
        methods: ["GET"],
        description: "Administrative monitoring and metrics",
        authentication: "Bearer token required",
        parameters: {
          action: {
            type: "string",
            required: false,
            enum: ["health", "stats", "overview"],
            description: "Monitoring action to perform"
          },
          endpoint: {
            type: "string",
            required: false,
            description: "Specific endpoint to get stats for (required for 'stats' action)"
          }
        },
        responses: {
          200: {
            description: "Monitoring data based on action",
            example: {
              overview: [
                {
                  endpoint: "performance-attribution",
                  stats: {
                    totalRequests: 156,
                    averageDuration: 234,
                    errorRate: 0.02
                  }
                }
              ]
            }
          }
        }
      }
    }
  },

  schemas: {
    AttributionItem: {
      type: "object",
      properties: {
        factor: { type: "string", description: "Performance factor name" },
        impact: { type: "number", description: "Impact score (-1 to 1)" }
      }
    },

    StrategyRecommendation: {
      type: "object",
      properties: {
        action: { type: "string", description: "Recommended action" },
        rationale: { type: "string", description: "Reasoning behind recommendation" },
        expectedImpact: { 
          type: "string", 
          enum: ["high", "medium", "low"], 
          description: "Expected impact level" 
        }
      }
    },

    LeagueMetrics: {
      type: "object",
      properties: {
        averageScore: { type: "number", description: "League average score" },
        standardDeviation: { type: "number", description: "Score standard deviation" },
        totalTeams: { type: "number", description: "Number of teams in league" }
      }
    }
  },

  authentication: {
    adminEndpoints: {
      description: "Admin endpoints require Bearer token authentication",
      header: "Authorization: Bearer <token>",
      tokens: {
        development: "astral2025",
        production: "Set via ADMIN_TOKEN environment variable"
      }
    }
  },

  rateLimit: {
    default: "100 requests per minute per IP",
    authenticated: "1000 requests per minute with valid token",
    monitoring: "Real-time monitoring tracks all requests"
  },

  caching: {
    analytics: "Analytics endpoints are cached for 5-15 minutes",
    health: "Health checks are not cached",
    admin: "Admin endpoints are not cached"
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const format = req.query.format as string
  const endpoint = req.query.endpoint as string

  if (endpoint) {
    // Get documentation for specific endpoint
    const docs = findEndpointDocs(endpoint)
    if (!docs) {
      return res.status(404).json({ error: 'Endpoint not found in documentation' })
    }
    return res.status(200).json(docs)
  }

  if (format === 'openapi') {
    // Return OpenAPI spec format
    return res.status(200).json(convertToOpenAPI(API_DOCUMENTATION))
  }

  // Return full documentation
  return res.status(200).json(API_DOCUMENTATION)
}

function findEndpointDocs(endpoint: string) {
  for (const category of Object.values(API_DOCUMENTATION.endpoints)) {
    if (category[endpoint]) {
      return {
        endpoint,
        ...category[endpoint],
        category: Object.keys(API_DOCUMENTATION.endpoints).find(
          key => API_DOCUMENTATION.endpoints[key][endpoint]
        )
      }
    }
  }
  return null
}

function convertToOpenAPI(docs: typeof API_DOCUMENTATION) {
  // Basic OpenAPI 3.0 conversion
  return {
    openapi: "3.0.0",
    info: {
      title: docs.title,
      description: docs.description,
      version: docs.version
    },
    servers: [
      { url: docs.baseUrl }
    ],
    paths: convertEndpointsToOpenAPI(docs.endpoints)
  }
}

function convertEndpointsToOpenAPI(endpoints: typeof API_DOCUMENTATION.endpoints) {
  const paths: any = {}
  
  for (const category of Object.values(endpoints)) {
    for (const [path, endpoint] of Object.entries(category)) {
      paths[path] = {}
      for (const method of endpoint.methods) {
        paths[path][method.toLowerCase()] = {
          summary: endpoint.description,
          parameters: endpoint.parameters ? Object.entries(endpoint.parameters).map(([name, param]) => ({
            name,
            in: method === 'GET' ? 'query' : 'body',
            required: param.required,
            schema: { type: param.type },
            description: param.description
          })) : [],
          responses: endpoint.responses
        }
      }
    }
  }
  
  return paths
}