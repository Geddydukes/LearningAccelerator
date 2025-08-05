import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressRing } from '../ProgressRing';

describe('ProgressRing Component', () => {
  it('renders with correct progress value', () => {
    render(<ProgressRing progress={75} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '75');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });

  it('displays progress label when enabled', () => {
    render(<ProgressRing progress={50} showLabel />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders custom children instead of label', () => {
    render(
      <ProgressRing progress={25} showLabel={false}>
        <span>Custom content</span>
      </ProgressRing>
    );
    expect(screen.getByText('Custom content')).toBeInTheDocument();
    expect(screen.queryByText('25%')).not.toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    const { container } = render(<ProgressRing progress={50} size="lg" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '80');
    expect(svg).toHaveAttribute('height', '80');
  });

  it('uses correct color scheme', () => {
    const { container } = render(<ProgressRing progress={50} color="emerald" />);
    const progressCircle = container.querySelector('circle:last-child');
    expect(progressCircle).toHaveAttribute('stroke', '#10b981');
  });
});