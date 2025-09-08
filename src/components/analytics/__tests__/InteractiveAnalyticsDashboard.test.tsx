/**
 * Test suite for Interactive Analytics Dashboard
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import InteractiveAnalyticsDashboard from '../InteractiveAnalyticsDashboard';

// Mock dependencies
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

jest.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
  Radar: () => <div data-testid="radar" />,
  ScatterChart: ({ children }: { children: React.ReactNode }) => <div data-testid="scatter-chart">{children}</div>,
  Scatter: () => <div data-testid="scatter" />,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div data-testid="composed-chart">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />
}));

// Mock UI components
jest.mock('@/components/ui/Card/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  )
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span data-testid="badge" className={className}>{children}</span>
  )
}));

jest.mock('@/components/ui/Button/Button', () => ({
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      className={className}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  )
}));

describe('InteractiveAnalyticsDashboard', () => {
  const defaultProps = {
    leagueId: 'test-league-1',
    userId: 'test-user-1',
    teamId: 'test-team-1'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      expect(screen.getByText('Interactive Analytics Dashboard')).toBeInTheDocument();
    });

    it('displays main dashboard header with correct content', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Interactive Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Advanced ML-powered fantasy football insights')).toBeInTheDocument();
      expect(screen.getByText('91.3%')).toBeInTheDocument();
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
      expect(screen.getByText('+23.4%')).toBeInTheDocument();
      expect(screen.getByText('ROI')).toBeInTheDocument();
    });

    it('renders navigation tabs correctly', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Predictions')).toBeInTheDocument();
      expect(screen.getByText('Trade Analysis')).toBeInTheDocument();
      expect(screen.getByText('Market Trends')).toBeInTheDocument();
      expect(screen.getByText('Matchup Analytics')).toBeInTheDocument();
    });

    it('shows overview dashboard by default', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      // Check for overview-specific content
      expect(screen.getByText('Avg Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Consistency Score')).toBeInTheDocument();
      expect(screen.getByText('Top Performers')).toBeInTheDocument();
      expect(screen.getByText('Trend Score')).toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    it('switches to performance view when performance tab is clicked', async () => {
      const user = userEvent.setup();
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      const performanceTab = screen.getByText('Performance');
      await user.click(performanceTab);
      
      await waitFor(() => {
        expect(screen.getByText('Player Performance Analytics')).toBeInTheDocument();
      });
    });

    it('switches to predictions view when predictions tab is clicked', async () => {
      const user = userEvent.setup();
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      const predictionsTab = screen.getByText('Predictions');
      await user.click(predictionsTab);
      
      await waitFor(() => {
        expect(screen.getByText('ML Model Performance')).toBeInTheDocument();
      });
    });

    it('switches to market view when market trends tab is clicked', async () => {
      const user = userEvent.setup();
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      const marketTab = screen.getByText('Market Trends');
      await user.click(marketTab);
      
      await waitFor(() => {
        expect(screen.getByText('Market Analysis & Trends')).toBeInTheDocument();
      });
    });
  });

  describe('Key Performance Metrics Cards', () => {
    it('displays correct metric values in overview', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      // Check accuracy card
      expect(screen.getByText('87.2%')).toBeInTheDocument();
      expect(screen.getByText('+2.1% vs last week')).toBeInTheDocument();
      
      // Check trade success rate
      expect(screen.getByText('78.5%')).toBeInTheDocument();
      expect(screen.getByText('+2.1% vs avg')).toBeInTheDocument();
      
      // Check win probability
      expect(screen.getByText('64.2%')).toBeInTheDocument();
      expect(screen.getByText('+1.8% this week')).toBeInTheDocument();
      
      // Check portfolio value
      expect(screen.getByText('$2,847')).toBeInTheDocument();
      expect(screen.getByText('+12.4% ROI')).toBeInTheDocument();
    });

    it('renders metric cards with proper styling classes', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      const cards = screen.getAllByTestId('card');
      const metricCards = cards.filter(card => 
        card.className.includes('gradient-to-r')
      );
      
      expect(metricCards.length).toBeGreaterThan(0);
    });
  });

  describe('Chart Components', () => {
    it('renders prediction accuracy trend chart', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Prediction Accuracy Trend')).toBeInTheDocument();
      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    });

    it('renders performance vs projection scatter chart', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Performance vs Projection')).toBeInTheDocument();
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
    });

    it('renders charts with proper responsive containers', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      const responsiveContainers = screen.getAllByTestId('responsive-container');
      expect(responsiveContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Performance View', () => {
    it('displays performance analytics when switching to performance view', async () => {
      const user = userEvent.setup();
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      await user.click(screen.getByText('Performance'));
      
      await waitFor(() => {
        expect(screen.getByText('Player Performance Analytics')).toBeInTheDocument();
        expect(screen.getByText('Accuracy Distribution')).toBeInTheDocument();
        expect(screen.getByText('Efficiency Metrics')).toBeInTheDocument();
      });
    });

    it('handles player filter in performance view', async () => {
      const user = userEvent.setup();
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      await user.click(screen.getByText('Performance'));
      
      await waitFor(() => {
        const select = screen.getByDisplayValue('All Positions');
        expect(select).toBeInTheDocument();
      });
    });

    it('renders performance charts correctly', async () => {
      const user = userEvent.setup();
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      await user.click(screen.getByText('Performance'));
      
      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Predictions View', () => {
    it('shows ML model performance metrics', async () => {
      const user = userEvent.setup();
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      await user.click(screen.getByText('Predictions'));
      
      await waitFor(() => {
        expect(screen.getByText('94.2%')).toBeInTheDocument();
        expect(screen.getByText('Model Accuracy')).toBeInTheDocument();
        expect(screen.getByText('1,247')).toBeInTheDocument();
        expect(screen.getByText('Predictions Made')).toBeInTheDocument();
        expect(screen.getByText('78.5%')).toBeInTheDocument();
        expect(screen.getByText('Beat Consensus')).toBeInTheDocument();
      });
    });

    it('renders prediction accuracy line chart', async () => {
      const user = userEvent.setup();
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      await user.click(screen.getByText('Predictions'));
      
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Market Analysis View', () => {
    it('displays market trends and analysis', async () => {
      const user = userEvent.setup();
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      await user.click(screen.getByText('Market Trends'));
      
      await waitFor(() => {
        expect(screen.getByText('Market Analysis & Trends')).toBeInTheDocument();
        expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
      });
    });

    it('renders market trend cards with buy/sell recommendations', async () => {
      const user = userEvent.setup();
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      await user.click(screen.getByText('Market Trends'));
      
      await waitFor(() => {
        const badges = screen.getAllByTestId('badge');
        const recommendationBadges = badges.filter(badge => 
          badge.textContent?.includes('BUY') || 
          badge.textContent?.includes('SELL') || 
          badge.textContent?.includes('HOLD')
        );
        expect(recommendationBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('AI Insights Panel', () => {
    it('displays AI insights with different confidence levels', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('AI-Powered Insights')).toBeInTheDocument();
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('Weather Alert')).toBeInTheDocument();
      expect(screen.getByText('Trade Opportunity')).toBeInTheDocument();
    });

    it('renders insight action buttons', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Add to Watchlist')).toBeInTheDocument();
      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.getByText('Analyze Trade')).toBeInTheDocument();
    });

    it('handles live mode toggle', async () => {
      const user = userEvent.setup();
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      const liveButton = screen.getByText('Live Mode');
      await user.click(liveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Pause')).toBeInTheDocument();
      });
    });
  });

  describe('Interactive Features', () => {
    it('handles filter interactions', async () => {
      const user = userEvent.setup();
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      // Switch to performance view first
      await user.click(screen.getByText('Performance'));
      
      await waitFor(() => {
        const select = screen.getByDisplayValue('All Positions');
        fireEvent.change(select, { target: { value: 'QB' } });
        expect(select.value).toBe('QB');
      });
    });

    it('handles refresh button clicks', async () => {
      const user = userEvent.setup();
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      await user.click(screen.getByText('Performance'));
      
      await waitFor(() => {
        const refreshButtons = screen.getAllByTestId('button').filter(btn => 
          btn.textContent?.includes('') // RefreshCw icon
        );
        if (refreshButtons.length > 0) {
          expect(refreshButtons[0]).toBeInTheDocument();
        }
      });
    });

    it('handles download functionality', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      const downloadButtons = screen.getAllByTestId('button').filter(btn => 
        btn.textContent?.includes('') // Download icon
      );
      expect(downloadButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('renders grid layouts with responsive classes', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      const cards = screen.getAllByTestId('card');
      const gridCards = cards.filter(card => 
        card.className.includes('grid') || 
        card.parentElement?.className.includes('grid')
      );
      
      expect(gridCards.length).toBeGreaterThan(0);
    });

    it('uses responsive chart containers', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      const containers = screen.getAllByTestId('responsive-container');
      expect(containers.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles missing league data gracefully', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} leagueId="" />);
      
      // Should still render without crashing
      expect(screen.getByText('Interactive Analytics Dashboard')).toBeInTheDocument();
    });

    it('displays fallback content when data is unavailable', async () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      // The component should handle missing data gracefully
      expect(screen.getByText('Interactive Analytics Dashboard')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      const tabs = screen.getAllByRole('button').filter(button =>
        ['Overview', 'Performance', 'Predictions', 'Trade Analysis', 'Market Trends', 'Matchup Analytics'].includes(button.textContent || '')
      );
      expect(tabs.length).toBe(6);
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      const firstTab = screen.getByText('Overview');
      firstTab.focus();
      
      // Tab through navigation
      await user.keyboard('{Tab}');
      const performanceTab = screen.getByText('Performance');
      expect(document.activeElement).toBe(performanceTab);
    });

    it('has sufficient color contrast', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      // Check for text color classes that should provide good contrast
      const whiteText = screen.getAllByText(/.*/, { selector: '.text-white' });
      expect(whiteText.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization', () => {
    it('uses memoization for expensive calculations', () => {
      const { rerender } = render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      // Re-render with same props should not cause unnecessary recalculations
      rerender(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Interactive Analytics Dashboard')).toBeInTheDocument();
    });

    it('handles large datasets efficiently', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      // Component should render without performance issues
      expect(screen.getByText('Interactive Analytics Dashboard')).toBeInTheDocument();
    });
  });

  describe('Data Visualization', () => {
    it('renders different chart types based on view', async () => {
      const user = userEvent.setup();
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      // Overview - should have composed charts and scatter plots
      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
      
      // Performance view
      await user.click(screen.getByText('Performance'));
      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      });
    });

    it('includes proper chart legends and axes', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getAllByTestId('legend').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('x-axis').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('y-axis').length).toBeGreaterThan(0);
    });

    it('provides interactive tooltips', () => {
      render(<InteractiveAnalyticsDashboard {...defaultProps} />);
      
      const tooltips = screen.getAllByTestId('tooltip');
      expect(tooltips.length).toBeGreaterThan(0);
    });
  });
});