import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StreamContainer } from '../components/workspace/StreamContainer';
import type { Agent } from '@/types';

const mockAgent: Agent = {
  id: 'a1',
  projectId: 'p1',
  name: 'Test Writer',
  role: 'writer',
  model: 'gpt-4o',
};

describe('StreamContainer', () => {
  describe('progress states', () => {
    it('should show "Waiting" label for pending state', () => {
      const { getByText } = render(
        <StreamContainer agent={mockAgent} progress="pending" />
      );
      expect(getByText('Waiting')).toBeDefined();
    });

    it('should show "Generating..." label for streaming state', () => {
      const { getByText } = render(
        <StreamContainer agent={mockAgent} progress="streaming" />
      );
      expect(getByText('Generating...')).toBeDefined();
    });

    it('should show "Completed" label for done state', () => {
      const { getByText } = render(
        <StreamContainer agent={mockAgent} progress="done" />
      );
      expect(getByText('Completed')).toBeDefined();
    });

    it('should show "Error" label for error state', () => {
      const { getByText } = render(
        <StreamContainer agent={mockAgent} progress="error" />
      );
      expect(getByText('Error')).toBeDefined();
    });
  });

  describe('content rendering', () => {
    it('should show loading skeleton when streaming without content', () => {
      const { getByText } = render(
        <StreamContainer agent={mockAgent} progress="streaming" />
      );
      expect(getByText('Generating document...')).toBeDefined();
    });

    it('should show content when provided', () => {
      const { getByText } = render(
        <StreamContainer agent={mockAgent} progress="done" content="Test document content" />
      );
      expect(getByText('Test document content')).toBeDefined();
    });

    it('should not show loading skeleton when content exists', () => {
      const { queryByText } = render(
        <StreamContainer agent={mockAgent} progress="streaming" content="Some content" />
      );
      expect(queryByText('Generating document...')).toBeNull();
    });
  });

  describe('agent role display', () => {
    it('should display writer role correctly', () => {
      const { container } = render(
        <StreamContainer agent={mockAgent} progress="pending" />
      );
      // Check for writer role badge with emoji
      expect(container.innerHTML).toContain('🤖');
      expect(container.innerHTML).toContain('writer');
    });

    it('should display reviewer role correctly', () => {
      const reviewer: Agent = { ...mockAgent, name: 'Review Test', role: 'reviewer' };
      const { container } = render(
        <StreamContainer agent={reviewer} progress="pending" />
      );
      // Check for reviewer role badge with emoji
      expect(container.innerHTML).toContain('🔍');
      expect(container.innerHTML).toContain('reviewer');
    });

    it('should display agent name', () => {
      const { getByText } = render(
        <StreamContainer agent={mockAgent} progress="pending" />
      );
      expect(getByText('Test Writer')).toBeDefined();
    });

    it('should display agent model', () => {
      const { getByText } = render(
        <StreamContainer agent={mockAgent} progress="pending" />
      );
      expect(getByText('(gpt-4o)')).toBeDefined();
    });
  });

  describe('retry functionality', () => {
    it('should show retry button on error state', () => {
      const onRetry = () => {};
      const { getByText } = render(
        <StreamContainer agent={mockAgent} progress="error" onRetry={onRetry} />
      );
      expect(getByText(/Retry.*Test Writer/)).toBeDefined();
    });

    it('should show error message when provided', () => {
      const { getByText } = render(
        <StreamContainer agent={mockAgent} progress="error" errorMsg="Connection timeout" />
      );
      expect(getByText('Connection timeout')).toBeDefined();
    });
  });

  describe('action buttons', () => {
    it('should show Edit and Copy buttons when done with content', () => {
      const onEdit = () => {};
      const onCopy = () => {};
      const { getByText } = render(
        <StreamContainer
          agent={mockAgent}
          progress="done"
          content="Test content"
          onEdit={onEdit}
          onCopy={onCopy}
        />
      );
      expect(getByText('Edit')).toBeDefined();
      expect(getByText('Copy MD')).toBeDefined();
    });
  });
});
