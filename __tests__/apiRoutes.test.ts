import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateProjectSchema, UpdateProjectSchema, UpdateDocumentSchema } from '../lib/ai/schemas';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    document: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    review: {
      upsert: vi.fn(),
    },
  },
}));

describe('API Schemas', () => {
  describe('CreateProjectSchema', () => {
    it('should accept valid PRD project with 2 writers and 1 reviewer', () => {
      const input = {
        title: 'My PRD',
        idea: 'Build an amazing product',
        docType: 'prd',
        agents: [
          { name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { name: 'Writer 2', role: 'writer', model: 'claude-3-5-sonnet' },
          { name: 'Reviewer', role: 'reviewer', model: 'gpt-4o-mini' },
        ],
      };
      expect(() => CreateProjectSchema.parse(input)).not.toThrow();
    });

    it('should accept valid SPEC project', () => {
      const input = {
        title: 'My Spec',
        idea: 'Technical specification',
        docType: 'spec',
        agents: [
          { name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { name: 'Writer 2', role: 'writer', model: 'claude-3-5-sonnet' },
          { name: 'Reviewer', role: 'reviewer', model: 'gpt-4o-mini' },
        ],
      };
      expect(() => CreateProjectSchema.parse(input)).not.toThrow();
    });

    it('should reject empty title', () => {
      const input = {
        title: '',
        idea: 'Idea',
        docType: 'prd',
        agents: [
          { name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { name: 'Writer 2', role: 'writer', model: 'claude-3-5-sonnet' },
          { name: 'Reviewer', role: 'reviewer', model: 'gpt-4o-mini' },
        ],
      };
      expect(() => CreateProjectSchema.parse(input)).toThrow();
    });

    it('should reject title over 200 characters', () => {
      const input = {
        title: 'a'.repeat(201),
        idea: 'Idea',
        docType: 'prd',
        agents: [
          { name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { name: 'Writer 2', role: 'writer', model: 'claude-3-5-sonnet' },
          { name: 'Reviewer', role: 'reviewer', model: 'gpt-4o-mini' },
        ],
      };
      expect(() => CreateProjectSchema.parse(input)).toThrow();
    });

    it('should reject idea over 5000 characters', () => {
      const input = {
        title: 'Valid Title',
        idea: 'a'.repeat(5001),
        docType: 'prd',
        agents: [
          { name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { name: 'Writer 2', role: 'writer', model: 'claude-3-5-sonnet' },
          { name: 'Reviewer', role: 'reviewer', model: 'gpt-4o-mini' },
        ],
      };
      expect(() => CreateProjectSchema.parse(input)).toThrow();
    });

    it('should reject only 1 writer', () => {
      const input = {
        title: 'Test',
        idea: 'Idea',
        docType: 'prd',
        agents: [
          { name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { name: 'Reviewer', role: 'reviewer', model: 'gpt-4o-mini' },
        ],
      };
      expect(() => CreateProjectSchema.parse(input)).toThrow();
    });

    it('should reject only reviewers (no writers)', () => {
      const input = {
        title: 'Test',
        idea: 'Idea',
        docType: 'prd',
        agents: [
          { name: 'Reviewer 1', role: 'reviewer', model: 'gpt-4o-mini' },
          { name: 'Reviewer 2', role: 'reviewer', model: 'gpt-4o' },
        ],
      };
      expect(() => CreateProjectSchema.parse(input)).toThrow();
    });

    it('should reject 3 writers but no reviewer', () => {
      const input = {
        title: 'Test',
        idea: 'Idea',
        docType: 'prd',
        agents: [
          { name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { name: 'Writer 2', role: 'writer', model: 'claude-3-5-sonnet' },
          { name: 'Writer 3', role: 'writer', model: 'claude-3-5-sonnet' },
        ],
      };
      expect(() => CreateProjectSchema.parse(input)).toThrow();
    });

    it('should accept more than 2 writers', () => {
      const input = {
        title: 'Test',
        idea: 'Idea',
        docType: 'prd',
        agents: [
          { name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { name: 'Writer 2', role: 'writer', model: 'claude-3-5-sonnet' },
          { name: 'Writer 3', role: 'writer', model: 'gemini-2.0-flash' },
          { name: 'Reviewer', role: 'reviewer', model: 'gpt-4o-mini' },
        ],
      };
      expect(() => CreateProjectSchema.parse(input)).not.toThrow();
    });

    it('should accept multiple reviewers', () => {
      const input = {
        title: 'Test',
        idea: 'Idea',
        docType: 'prd',
        agents: [
          { name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { name: 'Writer 2', role: 'writer', model: 'claude-3-5-sonnet' },
          { name: 'Reviewer 1', role: 'reviewer', model: 'gpt-4o-mini' },
          { name: 'Reviewer 2', role: 'reviewer', model: 'gpt-4o' },
        ],
      };
      expect(() => CreateProjectSchema.parse(input)).not.toThrow();
    });

    it('should reject invalid role', () => {
      const input = {
        title: 'Test',
        idea: 'Idea',
        docType: 'prd',
        agents: [
          { name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { name: 'Writer 2', role: 'editor', model: 'gpt-4o' }, // invalid role
          { name: 'Reviewer', role: 'reviewer', model: 'gpt-4o-mini' },
        ],
      };
      expect(() => CreateProjectSchema.parse(input)).toThrow();
    });
  });

  describe('UpdateProjectSchema', () => {
    it('should accept partial update with only title', () => {
      expect(() => UpdateProjectSchema.parse({ title: 'New Title' })).not.toThrow();
    });

    it('should accept partial update with only idea', () => {
      expect(() => UpdateProjectSchema.parse({ idea: 'New idea' })).not.toThrow();
    });

    it('should accept empty object (no updates)', () => {
      expect(() => UpdateProjectSchema.parse({})).not.toThrow();
    });

    it('should reject empty title', () => {
      expect(() => UpdateProjectSchema.parse({ title: '' })).toThrow();
    });

    it('should reject title over 200 characters', () => {
      expect(() => UpdateProjectSchema.parse({ title: 'a'.repeat(201) })).toThrow();
    });

    it('should reject idea over 5000 characters', () => {
      expect(() => UpdateProjectSchema.parse({ idea: 'a'.repeat(5001) })).toThrow();
    });
  });

  describe('UpdateDocumentSchema', () => {
    it('should accept valid content update', () => {
      expect(() => UpdateDocumentSchema.parse({ content: 'New document content' })).not.toThrow();
    });

    it('should accept empty content', () => {
      expect(() => UpdateDocumentSchema.parse({ content: '' })).not.toThrow();
    });

    it('should accept very long content', () => {
      expect(() => UpdateDocumentSchema.parse({ content: 'a'.repeat(100000) })).not.toThrow();
    });
  });
});