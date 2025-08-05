import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentCard } from '../AgentCard';
import { AgentStatus } from '../../../types';

const mockAgent: AgentStatus = {
  name: 'CLO - Curriculum Architect',
  status: 'idle',
  last_interaction: '2 hours ago',
  progress: 0
};

describe('AgentCard Component', () => {
  const mockOnInteract = jest.fn();
  const mockOnOpenModal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders agent information correctly', () => {
    render(
      <AgentCard 
        agent={mockAgent} 
        onInteract={mockOnInteract}
        onOpenModal={mockOnOpenModal}
      />
    );

    expect(screen.getByText('CLO - Curriculum Architect')).toBeInTheDocument();
    expect(screen.getByText('idle')).toBeInTheDocument();
    expect(screen.getByText('Last: 2 hours ago')).toBeInTheDocument();
  });

  it('shows correct status colors', () => {
    const completedAgent = { ...mockAgent, status: 'completed' as const };
    render(
      <AgentCard 
        agent={completedAgent} 
        onInteract={mockOnInteract}
      />
    );

    const statusIcon = screen.getByText('completed').previousElementSibling;
    expect(statusIcon).toHaveClass('text-emerald-500');
  });

  it('disables buttons when processing', () => {
    const processingAgent = { ...mockAgent, status: 'processing' as const };
    render(
      <AgentCard 
        agent={processingAgent} 
        onInteract={mockOnInteract}
        onOpenModal={mockOnOpenModal}
      />
    );

    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /open/i })).toBeDisabled();
  });

  it('calls onInteract when start button clicked', () => {
    render(
      <AgentCard 
        agent={mockAgent} 
        onInteract={mockOnInteract}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    expect(mockOnInteract).toHaveBeenCalledTimes(1);
  });

  it('shows review button for completed agents', () => {
    const completedAgent = { ...mockAgent, status: 'completed' as const };
    render(
      <AgentCard 
        agent={completedAgent} 
        onInteract={mockOnInteract}
      />
    );

    expect(screen.getByRole('button', { name: /review/i })).toBeInTheDocument();
  });

  it('displays progress bar with correct value', () => {
    const agentWithProgress = { ...mockAgent, progress: 75 };
    render(
      <AgentCard 
        agent={agentWithProgress} 
        onInteract={mockOnInteract}
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
  });
});