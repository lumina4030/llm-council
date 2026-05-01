import { describe, it, expect } from 'vitest';
import { CreateProjectSchema, UpdateProjectSchema, ReviewerOutputSchema } from '../lib/ai/schemas';

describe('Zod Schemas', () => {
  describe('CreateProjectSchema', () => {
    it('should validate valid project input', () => {
      const validInput = {
        title: 'Test Project',
        idea: 'Build a great product',
        docType: 'prd',
        agents: [
          { name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { name: 'Writer 2', role: 'writer', model: 'claude-3-5-sonnet' },
          { name: 'Reviewer', role: 'reviewer', model: 'gpt-4o-mini' },
        ],
      };

      expect(() => CreateProjectSchema.parse(validInput)).not.toThrow();
    });

    it('should reject less than 2 writers', () => {
      const invalidInput = {
        title: 'Test Project',
        idea: 'Build a great product',
        docType: 'prd',
        agents: [
          { name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { name: 'Reviewer', role: 'reviewer', model: 'gpt-4o-mini' },
        ],
      };

      expect(() => CreateProjectSchema.parse(invalidInput)).toThrow();
    });

    it('should reject less than 1 reviewer', () => {
      const invalidInput = {
        title: 'Test Project',
        idea: 'Build a great product',
        docType: 'prd',
        agents: [
          { name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { name: 'Writer 2', role: 'writer', model: 'claude-3-5-sonnet' },
        ],
      };

      expect(() => CreateProjectSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid docType', () => {
      const invalidInput = {
        title: 'Test Project',
        idea: 'Build a great product',
        docType: 'invalid',
        agents: [
          { name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { name: 'Writer 2', role: 'writer', model: 'claude-3-5-sonnet' },
          { name: 'Reviewer', role: 'reviewer', model: 'gpt-4o-mini' },
        ],
      };

      expect(() => CreateProjectSchema.parse(invalidInput)).toThrow();
    });
  });

  describe('ReviewerOutputSchema', () => {
    it('should validate valid reviewer output', () => {
      const validOutput = {
        scores: [
          { writerName: 'Writer 1', writerId: '123', score: 8, comment: 'Good document' },
          { writerName: 'Writer 2', writerId: '456', score: 9, comment: 'Excellent' },
        ],
        best: {
          writerName: 'Writer 2',
          writerId: '456',
          reason: 'More complete and actionable',
        },
      };

      expect(() => ReviewerOutputSchema.parse(validOutput)).not.toThrow();
    });

    it('should reject score out of range', () => {
      const invalidOutput = {
        scores: [
          { writerName: 'Writer 1', writerId: '123', score: 15, comment: 'Too high' },
        ],
        best: {
          writerName: 'Writer 1',
          writerId: '123',
          reason: 'Only one',
        },
      };

      expect(() => ReviewerOutputSchema.parse(invalidOutput)).toThrow();
    });
  });
});