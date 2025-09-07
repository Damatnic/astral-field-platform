import { supabase } from '@/lib/supabase'

export interface WeatherData {
  gameId: string
  homeTeam: string
  awayTeam: string
  venue: string
  gameTime: string
  temperature: number
  condition: 'sunny' | 'cloudy' | 'rain' | 'snow' | 'wind' | 'dome'
  windSpeed: number
  windDirection: string
  humidity: number
  precipitation: number
  visibility: number
  isDome: boolean
  impactLevel: 'none' | 'low' | 'medium' | 'high'
  fantasyImpact: {
    passing: 'positive' | 'negative' | 'neutral'
    rushing: 'positive' | 'negative' | 'neutral'
    kicking: 'positive' | 'negative' | 'neutral'
    overall: number // -3 to +3 scale
  }
}

export interface WeatherImpact {
  playerId: string
  playerName: string
  position: string
  team: string
  gameWeather: WeatherData
  impactScore: number
  recommendations: string[]
  confidenceLevel: number
}

class WeatherService {
  private readonly WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY
  private readonly NFL_VENUES_API = process.env.NEXT_PUBLIC_NFL_VENUES_API

  // Get weather data for current week's games
  async getCurrentWeekWeather(week: number): Promise<WeatherData[]> {
    try {
      // Get games for the current week
      const { data: games, error: gamesError } = await supabase
        .from('nfl_games')
        .select('*')
        .eq('week', week)
        .eq('season_type', 'REG')

      if (gamesError) throw gamesError

      const weatherData: WeatherData[] = []

      for (const game of games) {
        try {
          // Skip dome games
          if (this.isDomeVenue(game.venue)) {
            weatherData.push({
              gameId: game.id,
              homeTeam: game.home_team,
              awayTeam: game.away_team,
              venue: game.venue,
              gameTime: game.game_time,
              temperature: 72,
              condition: 'dome',
              windSpeed: 0,
              windDirection: 'N/A',
              humidity: 50,
              precipitation: 0,
              visibility: 10,
              isDome: true,
              impactLevel: 'none',
              fantasyImpact: {
                passing: 'neutral',
                rushing: 'neutral',
                kicking: 'neutral',
                overall: 0
              }
            })
            continue
          }

          // Get weather data for outdoor games
          const weather = await this.fetchWeatherForVenue(game.venue, game.game_time)
          if (weather) {
            weatherData.push(weather)
          }
        } catch (error) {
          console.error(`Failed to get weather for game ${game.id}:`, error)
          // Add default weather data if API fails
          weatherData.push(this.getDefaultWeatherData(game))
        }
      }

      return weatherData
    } catch (error) {
      console.error('Failed to get current week weather:', error)
      return []
    }
  }

  // Get weather impact for specific players
  async getPlayerWeatherImpact(playerIds: string[], week: number): Promise<WeatherImpact[]> {
    try {
      const weatherData = await this.getCurrentWeekWeather(week)
      const impacts: WeatherImpact[] = []

      // Get player data
      const { data: players, error } = await supabase
        .from('players')
        .select('*')
        .in('id', playerIds)

      if (error) throw error

      for (const player of players) {
        // Find the weather data for this player's game
        const gameWeather = weatherData.find(w => 
          w.homeTeam === player.nfl_team || w.awayTeam === player.nfl_team
        )

        if (gameWeather) {
          const impact = this.calculatePlayerWeatherImpact(player, gameWeather)
          impacts.push(impact)
        }
      }

      return impacts
    } catch (error) {
      console.error('Failed to get player weather impact:', error)
      return []
    }
  }

  // Fetch weather data from external API
  private async fetchWeatherForVenue(venue: string, gameTime: string): Promise<WeatherData | null> {
    try {
      // Get venue coordinates
      const coordinates = this.getVenueCoordinates(venue)
      if (!coordinates) return null

      // Mock weather API call - replace with actual weather API
      const mockWeatherResponse = {
        temperature: 45,
        condition: 'cloudy' as const,
        windSpeed: 15,
        windDirection: 'NW',
        humidity: 65,
        precipitation: 0.1,
        visibility: 8
      }

      const weatherData: WeatherData = {
        gameId: `${venue}_${gameTime}`,
        homeTeam: this.getHomeTeamForVenue(venue),
        awayTeam: '', // Will be filled by caller
        venue,
        gameTime,
        temperature: mockWeatherResponse.temperature,
        condition: mockWeatherResponse.condition,
        windSpeed: mockWeatherResponse.windSpeed,
        windDirection: mockWeatherResponse.windDirection,
        humidity: mockWeatherResponse.humidity,
        precipitation: mockWeatherResponse.precipitation,
        visibility: mockWeatherResponse.visibility,
        isDome: false,
        impactLevel: this.calculateImpactLevel(mockWeatherResponse),
        fantasyImpact: this.calculateFantasyImpact(mockWeatherResponse)
      }

      return weatherData
    } catch (error) {
      console.error('Failed to fetch weather for venue:', error)
      return null
    }
  }

  // Calculate weather impact on fantasy performance
  private calculatePlayerWeatherImpact(player: any, weather: WeatherData): WeatherImpact {
    let impactScore = 0
    const recommendations: string[] = []
    let confidenceLevel = 75

    // Position-specific weather impacts
    switch (player.position) {
      case 'QB':
        if (weather.condition === 'rain' || weather.windSpeed > 20) {
          impactScore -= 2
          recommendations.push('Passing accuracy may be reduced in poor weather')
        }
        if (weather.temperature < 32) {
          impactScore -= 1
          recommendations.push('Cold weather can affect grip and ball handling')
        }
        break

      case 'RB':
        if (weather.condition === 'rain') {
          impactScore += 1
          recommendations.push('Running game often benefits from wet conditions')
        }
        if (weather.condition === 'snow') {
          impactScore += 2
          recommendations.push('Snow typically favors ground game over passing')
        }
        break

      case 'WR':
      case 'TE':
        if (weather.condition === 'rain' || weather.windSpeed > 15) {
          impactScore -= 2
          recommendations.push('Wet conditions can lead to dropped passes')
        }
        if (weather.windSpeed > 25) {
          impactScore -= 3
          recommendations.push('High winds significantly impact passing game')
        }
        break

      case 'K':
        if (weather.windSpeed > 15) {
          impactScore -= 2
          recommendations.push('Wind affects kicking accuracy and distance')
        }
        if (weather.condition === 'snow' || weather.condition === 'rain') {
          impactScore -= 1
          recommendations.push('Precipitation can affect field conditions and footing')
        }
        break

      case 'DST':
        if (weather.impactLevel === 'high') {
          impactScore += 1
          recommendations.push('Poor weather often leads to more turnovers')
        }
        break
    }

    // Dome adjustments
    if (weather.isDome) {
      impactScore = 0
      recommendations.push('Dome conditions provide consistent environment')
      confidenceLevel = 95
    }

    return {
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      team: player.nfl_team,
      gameWeather: weather,
      impactScore,
      recommendations,
      confidenceLevel
    }
  }

  // Calculate overall impact level
  private calculateImpactLevel(weather: any): 'none' | 'low' | 'medium' | 'high' {
    let score = 0

    if (weather.windSpeed > 15) score += 1
    if (weather.windSpeed > 25) score += 2
    if (weather.precipitation > 0) score += 1
    if (weather.temperature < 32 || weather.temperature > 90) score += 1
    if (weather.visibility < 5) score += 2

    if (score === 0) return 'none'
    if (score <= 2) return 'low'
    if (score <= 4) return 'medium'
    return 'high'
  }

  // Calculate fantasy impact by category
  private calculateFantasyImpact(weather: any) {
    const impact: { passing: 'positive'|'neutral'|'negative'; rushing: 'positive'|'neutral'|'negative'; kicking: 'positive'|'neutral'|'negative'; overall: number } = {
      passing: 'neutral',
      rushing: 'neutral',
      kicking: 'neutral',
      overall: 0
    }

    // Passing impact
    if (weather.windSpeed > 20 || weather.precipitation > 0.5) {
      impact.passing = 'negative'
      impact.overall -= 1
    }

    // Rushing impact
    if (weather.condition === 'rain' || weather.condition === 'snow') {
      impact.rushing = 'positive'
      impact.overall += 1
    }

    // Kicking impact
    if (weather.windSpeed > 15 || weather.precipitation > 0) {
      impact.kicking = 'negative'
      impact.overall -= 1
    }

    return impact
  }

  // Check if venue is a dome
  private isDomeVenue(venue: string): boolean {
    const domeVenues = [
      'Mercedes-Benz Superdome',
      'Ford Field',
      'Mercedes-Benz Stadium',
      'NRG Stadium',
      'Lucas Oil Stadium',
      'Caesars Superdome',
      'U.S. Bank Stadium',
      'Allegiant Stadium'
    ]
    return domeVenues.includes(venue)
  }

  // Get venue coordinates (mock data)
  private getVenueCoordinates(venue: string) {
    const coordinates: { [venue: string]: { lat: number; lon: number } } = {
      'Lambeau Field': { lat: 44.5013, lon: -88.0622 },
      'Soldier Field': { lat: 41.8623, lon: -87.6167 },
      'Gillette Stadium': { lat: 42.0909, lon: -71.2643 },
      // Add more venues as needed
    }
    return coordinates[venue] || null
  }

  // Get home team for venue
  private getHomeTeamForVenue(venue: string): string {
    const venueTeams: { [venue: string]: string } = {
      'Lambeau Field': 'GB',
      'Soldier Field': 'CHI',
      'Gillette Stadium': 'NE',
      // Add more venues as needed
    }
    return venueTeams[venue] || ''
  }

  // Get default weather data if API fails
  private getDefaultWeatherData(game: any): WeatherData {
    return {
      gameId: game.id,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      venue: game.venue,
      gameTime: game.game_time,
      temperature: 65,
      condition: 'cloudy',
      windSpeed: 8,
      windDirection: 'W',
      humidity: 55,
      precipitation: 0,
      visibility: 10,
      isDome: this.isDomeVenue(game.venue),
      impactLevel: 'low',
      fantasyImpact: {
        passing: 'neutral',
        rushing: 'neutral',
        kicking: 'neutral',
        overall: 0
      }
    }
  }

  // Get historical weather trends for a venue
  async getVenueWeatherTrends(venue: string, weeks: number = 4): Promise<any> {
    try {
      // This would fetch historical weather data
      // For now, return mock trend data
      return {
        venue,
        averageTemperature: 58,
        averageWindSpeed: 12,
        rainPercentage: 25,
        snowPercentage: 5,
        impactGames: 3,
        totalGames: weeks
      }
    } catch (error) {
      console.error('Failed to get venue weather trends:', error)
      return null
    }
  }

  // Get weather recommendations for lineup decisions
  getWeatherRecommendations(impacts: WeatherImpact[]): string[] {
    const recommendations: string[] = []

    const highImpactPlayers = impacts.filter(p => Math.abs(p.impactScore) >= 2)
    const negativeImpactPlayers = impacts.filter(p => p.impactScore < -1)
    const positiveImpactPlayers = impacts.filter(p => p.impactScore > 1)

    if (highImpactPlayers.length > 0) {
      recommendations.push(`${highImpactPlayers.length} players face significant weather impacts this week`)
    }

    if (negativeImpactPlayers.length > 0) {
      recommendations.push(`Consider benching: ${negativeImpactPlayers.map(p => p.playerName).join(', ')}`)
    }

    if (positiveImpactPlayers.length > 0) {
      recommendations.push(`Weather favors: ${positiveImpactPlayers.map(p => p.playerName).join(', ')}`)
    }

    return recommendations
  }
}

const weatherService = new WeatherService()
export default weatherService
