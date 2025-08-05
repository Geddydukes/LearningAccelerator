import React from 'react';
import { render, screen } from '@testing-library/react';
import { KPITrend, KPIGrid } from '../KPITrend';

const mockMetric = {
  name: 'Learning Velocity',
  current: 85,
  target: 100,
  trend: 'up' as const,
  change: 15,
  unit: '%',
  category: 'learning' as const
};

describe('KPITrend Component', () => {
  it('renders metric information correctly', () => {
    render(<KPITrend metric={mockMetric} />);
    
    expect(screen.getByText('Learning Velocity')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('/ 100%')).toBeInTheDocument();
    expect(screen.getByText('+15%')).toBeInTheDocument();
  });

  it('shows correct trend colors', () => {
    render(<KPITrend metric={mockMetric} />);
    
    const trendElement = screen.getByText('+15%').parentElement;
    expect(trendElement).toHaveClass('text-emerald-600');
  });

  it('renders in compact variant', () => {
    render(<KPITrend metric={mockMetric} variant="compact" />);
    
    expect(screen.getByText('Learning Velocity')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders in detailed variant with progress bar', () => {
    render(<KPITrend metric={mockMetric} variant="detailed" />);
    
    expect(screen.getByText('Learning Velocity')).toBeInTheDocument();
    expect(screen.getByText('Target: 100%')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('85.0%')).toBeInTheDocument();
  });

  it('shows target reached message when current >= target', () => {
    const targetReachedMetric = { ...mockMetric, current: 100 };
    render(<KPITrend metric={targetReachedMetric} variant="detailed" />);
    
    expect(screen.getByText('Target reached!')).toBeInTheDocument();
  });

  it('handles down trend correctly', () => {
    const downTrendMetric = { ...mockMetric, trend: 'down' as const, change: -5 };
    render(<KPITrend metric={downTrendMetric} />);
    
    expect(screen.getByText('-5%')).toBeInTheDocument();
    const trendElement = screen.getByText('-5%').parentElement;
    expect(trendElement).toHaveClass('text-red-600');
  });

  it('handles stable trend correctly', () => {
    const stableTrendMetric = { ...mockMetric, trend: 'stable' as const, change: 0 };
    render(<KPITrend metric={stableTrendMetric} />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
    const trendElement = screen.getByText('0%').parentElement;
    expect(trendElement).toHaveClass('text-gray-600');
  });
});

describe('KPIGrid Component', () => {
  const mockMetrics = [
    mockMetric,
    {
      name: 'Code Quality',
      current: 8.5,
      target: 9.0,
      trend: 'up' as const,
      change: 0.5,
      unit: '/10',
      category: 'achievement' as const
    }
  ];

  it('renders multiple metrics', () => {
    render(<KPIGrid metrics={mockMetrics} />);
    
    expect(screen.getByText('Learning Velocity')).toBeInTheDocument();
    expect(screen.getByText('Code Quality')).toBeInTheDocument();
  });

  it('applies correct grid layout for default variant', () => {
    const { container } = render(<KPIGrid metrics={mockMetrics} />);
    
    const grid = container.firstChild;
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
  });

  it('applies compact layout', () => {
    const { container } = render(<KPIGrid metrics={mockMetrics} variant="compact" />);
    
    const grid = container.firstChild;
    expect(grid).toHaveClass('space-y-2');
  });
});