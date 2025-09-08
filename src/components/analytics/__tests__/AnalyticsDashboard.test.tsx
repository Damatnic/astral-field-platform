import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import AnalyticsDashboard from '../AnalyticsDashboard';
import nflDataProvider from '@/services/nfl/dataProvider';

// Mock dependencies
jest.mock('@/lib/websocket/client', () => ({
  getWebSocketClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
    emit: jest.fn(),
  })),
}));

jest.mock('@/services/nfl/dataProvider');
jest.mock('@/services/fantasy/scoringEngine');

const mockNflDataProvider = nflDataProvider as jest.Mocked<typeof nflDataProvider>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('AnalyticsDashboard', () => {
  const defaultProps = {
    leagueId: 'league-123',
    teamId: 'team-456',
    playerId: 'player-789',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock NFL data provider methods
    mockNflDataProvider.getCurrentWeek.mockResolvedValue(8);
    mockNflDataProvider.getPlayerStats.mockResolvedValue({
      projectedPoints: 25.5,
      redZoneTargets: 3,
      snapCount: 45,
      targets: 8,
    });
    mockNflDataProvider.getWeatherData.mockResolvedValue({
      temperature: 70,
      windSpeed: 5,
      precipitation: 0,
      dome: false,
    });

    // Mock fetch responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          matchups: [{
            home_team_id: 'team-456',
            away_team_id: 'team-999',
            game_id: 'game-123',
          }],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          teams: [
            { team_name: 'Team Alpha', owner_name: 'Owner 1' },
            { team_name: 'Team Beta', owner_name: 'Owner 2' },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { team_name: 'Team Alpha', rank: 1 },
          { team_name: 'Team Beta', rank: 2 },
        ]),
      } as Response);
  });

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      
      // Check for loading skeleton
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should render tab navigation correctly', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Player Analysis')).toBeInTheDocument();
        expect(screen.getByText('Matchup Analysis')).toBeInTheDocument();
        expect(screen.getByText('League Insights')).toBeInTheDocument();
      });
    });

    it('should render week selector', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        const weekSelect = screen.getByDisplayValue('Week 2');
        expect(weekSelect).toBeInTheDocument();
      });
    });
  });

  describe('Player Analysis Tab', () => {
    it('should display player analytics when data loads successfully', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Josh Allen')).toBeInTheDocument();
        expect(screen.getByText('BUF • QB')).toBeInTheDocument();
        expect(screen.getByText('24.5')).toBeInTheDocument();
        expect(screen.getByText('Avg Points')).toBeInTheDocument();
      });

      // Check for performance metrics
      expect(screen.getByText('Consistency')).toBeInTheDocument();
      expect(screen.getByText('Ceiling')).toBeInTheDocument();
      expect(screen.getByText('Floor')).toBeInTheDocument();
      expect(screen.getByText('Trend')).toBeInTheDocument();
    });

    it('should display weekly performance chart', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Weekly Performance')).toBeInTheDocument();
      });

      // Chart elements should be present
      const chart = document.querySelector('.recharts-wrapper');
      expect(chart).toBeInTheDocument();
    });

    it('should handle player data loading errors gracefully', async () => {
      mockNflDataProvider.getPlayerStats.mockRejectedValue(new Error('API Error'));
      
      render(<AnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        // Should fall back to mock data
        expect(screen.getByText('Josh Allen')).toBeInTheDocument();
      });
    });

    it('should display trend indicators correctly', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        // Should show trend icon and text
        expect(screen.getByText('↗')).toBeInTheDocument(); // Up trend
        expect(screen.getByText('up')).toBeInTheDocument();
      });
    });
  });

  describe('Matchup Analysis Tab', () => {
    beforeEach(() => {
      // Additional mocks for matchup tab
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            matchups: [{
              home_team_id: 'team-456',
              away_team_id: 'team-999',
              game_id: 'game-123',
            }],
          }),
        } as Response)
      );
    });

    it('should switch to matchup tab when clicked', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      const matchupTab = screen.getByText('Matchup Analysis');
      fireEvent.click(matchupTab);
      
      await waitFor(() => {
        expect(screen.getByText('Week 2 Matchup')).toBeInTheDocument();
        expect(screen.getByText('Your Team')).toBeInTheDocument();
        expect(screen.getByText('vs')).toBeInTheDocument();
      });
    });

    it('should display matchup metrics', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      const matchupTab = screen.getByText('Matchup Analysis');
      fireEvent.click(matchupTab);
      
      await waitFor(() => {
        expect(screen.getByText('Difficulty')).toBeInTheDocument();
        expect(screen.getByText('Projected')).toBeInTheDocument();
        expect(screen.getByText('Confidence')).toBeInTheDocument();
        expect(screen.getByText('Weather Impact')).toBeInTheDocument();
      });
    });

    it('should display win probability gauge', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      const matchupTab = screen.getByText('Matchup Analysis');
      fireEvent.click(matchupTab);
      
      await waitFor(() => {
        expect(screen.getByText('Win Probability')).toBeInTheDocument();
        const gauge = document.querySelector('.bg-gradient-to-r');
        expect(gauge).toBeInTheDocument();
      });
    });

    it('should display game script analysis', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      const matchupTab = screen.getByText('Matchup Analysis');
      fireEvent.click(matchupTab);
      
      await waitFor(() => {
        expect(screen.getByText('Game Script Analysis')).toBeInTheDocument();
        expect(screen.getByText('Expected Game Flow:')).toBeInTheDocument();
      });
    });

    it('should handle matchup data loading errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Matchup API Error'));
      
      render(<AnalyticsDashboard {...defaultProps} />);
      
      const matchupTab = screen.getByText('Matchup Analysis');
      fireEvent.click(matchupTab);
      
      await waitFor(() => {
        // Should fall back to mock data
        expect(screen.getByText('Miami Dolphins')).toBeInTheDocument();
      });
    });
  });

  describe('League Insights Tab', () => {
    it('should switch to league insights tab when clicked', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      const leagueTab = screen.getByText('League Insights');
      fireEvent.click(leagueTab);
      
      await waitFor(() => {
        expect(screen.getByText('Power Rankings')).toBeInTheDocument();
        expect(screen.getByText('Playoff Probabilities')).toBeInTheDocument();
        expect(screen.getByText('Top Trade Values')).toBeInTheDocument();
      });
    });

    it('should display power rankings', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      const leagueTab = screen.getByText('League Insights');
      fireEvent.click(leagueTab);
      
      await waitFor(() => {
        expect(screen.getByText("D'Amato Dynasty")).toBeInTheDocument();
        expect(screen.getByText("Kornbeck's Krusaders")).toBeInTheDocument();
        expect(screen.getByText('Nicholas')).toBeInTheDocument();
        expect(screen.getByText('Jon')).toBeInTheDocument();
      });
    });

    it('should display playoff probabilities chart', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      const leagueTab = screen.getByText('League Insights');
      fireEvent.click(leagueTab);
      
      await waitFor(() => {
        const chart = document.querySelector('.recharts-wrapper');
        expect(chart).toBeInTheDocument();
      });
    });

    it('should display trade values', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      const leagueTab = screen.getByText('League Insights');
      fireEvent.click(leagueTab);
      
      await waitFor(() => {
        expect(screen.getByText('Josh Allen')).toBeInTheDocument();
        expect(screen.getByText('Christian McCaffrey')).toBeInTheDocument();
        expect(screen.getByText('Tyreek Hill')).toBeInTheDocument();
      });
    });

    it('should handle league data loading errors', async () => {
      mockFetch.mockRejectedValue(new Error('League API Error'));
      
      render(<AnalyticsDashboard {...defaultProps} />);
      
      const leagueTab = screen.getByText('League Insights');
      fireEvent.click(leagueTab);
      
      await waitFor(() => {
        // Should still show fallback data
        expect(screen.getByText('Power Rankings')).toBeInTheDocument();
      });
    });
  });

  describe('Week Selection', () => {
    it('should update selected week when dropdown changes', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        const weekSelect = screen.getByDisplayValue('Week 2');
        fireEvent.change(weekSelect, { target: { value: '5' } });
        
        expect(weekSelect).toHaveValue('5');
      });
    });

    it('should reload data when week changes', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        const weekSelect = screen.getByDisplayValue('Week 2');
        fireEvent.change(weekSelect, { target: { value: '5' } });
      });

      // Should trigger new data loading
      await waitFor(() => {
        expect(mockNflDataProvider.getPlayerStats).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('AI Insights Panel', () => {
    it('should display AI insights panel', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('AI Insights')).toBeInTheDocument();
        expect(screen.getByText('🤖')).toBeInTheDocument();
      });
    });

    it('should show different insights based on active tab', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      // Player tab insights
      await waitFor(() => {
        expect(screen.getByText(/Josh Allen has a 78% chance/)).toBeInTheDocument();
      });

      // Matchup tab insights
      const matchupTab = screen.getByText('Matchup Analysis');
      fireEvent.click(matchupTab);
      
      await waitFor(() => {
        expect(screen.getByText(/favorable matchups at RB and WR/)).toBeInTheDocument();
      });

      // League tab insights
      const leagueTab = screen.getByText('League Insights');
      fireEvent.click(leagueTab);
      
      await waitFor(() => {
        expect(screen.getByText(/Trade market is favorable/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        const weekSelect = screen.getByRole('combobox');
        expect(weekSelect).toBeInTheDocument();
        
        const tabs = screen.getAllByRole('button');
        expect(tabs.length).toBeGreaterThan(0);
      });
    });

    it('should support keyboard navigation', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        const playerTab = screen.getByText('Player Analysis');
        const matchupTab = screen.getByText('Matchup Analysis');
        
        // Tab should be focusable
        playerTab.focus();
        expect(document.activeElement).toBe(playerTab);
        
        // Should be able to navigate between tabs
        fireEvent.keyDown(playerTab, { key: 'Tab' });
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should debounce rapid week selections', async () => {
      render(<AnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        const weekSelect = screen.getByDisplayValue('Week 2');
        
        // Rapid changes
        fireEvent.change(weekSelect, { target: { value: '3' } });
        fireEvent.change(weekSelect, { target: { value: '4' } });
        fireEvent.change(weekSelect, { target: { value: '5' } });
      });

      // Should not make excessive API calls
      expect(mockNflDataProvider.getPlayerStats).toHaveBeenCalledTimes(2); // Initial + final
    });

    it('should handle concurrent data loading gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock delayed responses
      mockFetch
        .mockImplementationOnce(() => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ matchups: [] }),
          } as Response), 100)
        ))
        .mockImplementationOnce(() => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ teams: [] }),
          } as Response), 50)
        ));

      render(<AnalyticsDashboard {...defaultProps} />);
      
      // Switch tabs rapidly
      const matchupTab = screen.getByText('Matchup Analysis');
      const leagueTab = screen.getByText('League Insights');
      
      fireEvent.click(matchupTab);
      fireEvent.click(leagueTab);
      fireEvent.click(matchupTab);
      
      await waitFor(() => {
        // Should handle without errors
        expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Error loading'));
      }, { timeout: 200 });

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should display error state gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockNflDataProvider.getCurrentWeek.mockRejectedValue(new Error('Network Error'));
      
      render(<AnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        // Should still render without crashing
        expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null), // Malformed response
      } as Response);
      
      render(<AnalyticsDashboard {...defaultProps} />);
      
      const matchupTab = screen.getByText('Matchup Analysis');
      fireEvent.click(matchupTab);
      
      await waitFor(() => {
        // Should fall back to mock data
        expect(screen.getByText('Miami Dolphins')).toBeInTheDocument();
      });
    });
  });

  describe('Props Validation', () => {
    it('should handle missing optional props', () => {
      const minimalProps = { leagueId: 'league-123' };
      
      expect(() => {
        render(<AnalyticsDashboard {...minimalProps} />);
      }).not.toThrow();
    });

    it('should handle empty string props', async () => {
      const emptyProps = {
        leagueId: '',
        teamId: '',
        playerId: '',
      };
      
      render(<AnalyticsDashboard {...emptyProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      });
    });
  });
});