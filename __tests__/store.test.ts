import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../store/projectStore';

describe('ProjectStore', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have null project', () => {
      expect(useProjectStore.getState().project).toBeNull();
    });

    it('should have empty agents array', () => {
      expect(useProjectStore.getState().agents).toEqual([]);
    });

    it('should have empty documents array', () => {
      expect(useProjectStore.getState().documents).toEqual([]);
    });

    it('should have null review', () => {
      expect(useProjectStore.getState().review).toBeNull();
    });

    it('should not be generating', () => {
      expect(useProjectStore.getState().isGenerating).toBe(false);
    });

    it('should have empty writerProgress', () => {
      expect(useProjectStore.getState().writerProgress).toEqual({});
    });
  });

  describe('setProjectData', () => {
    it('should set project and related data', () => {
      const mockData = {
        project: { id: '1', title: 'Test', idea: 'Idea', docType: 'prd', status: 'idle', createdAt: new Date(), updatedAt: new Date() },
        agents: [
          { id: 'a1', projectId: '1', name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { id: 'a2', projectId: '1', name: 'Writer 2', role: 'writer', model: 'claude-3-5-sonnet' },
          { id: 'a3', projectId: '1', name: 'Reviewer', role: 'reviewer', model: 'gpt-4o-mini' },
        ],
        documents: [],
        review: null,
      };

      useProjectStore.getState().setProjectData(mockData);

      const state = useProjectStore.getState();
      expect(state.project).toEqual(mockData.project);
      expect(state.agents).toEqual(mockData.agents);
      expect(state.review).toBeNull();
    });

    it('should initialize writerProgress for all writers', () => {
      const mockData = {
        project: { id: '1', title: 'Test', idea: 'Idea', docType: 'prd', status: 'idle', createdAt: new Date(), updatedAt: new Date() },
        agents: [
          { id: 'a1', projectId: '1', name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { id: 'a2', projectId: '1', name: 'Writer 2', role: 'writer', model: 'claude-3-5-sonnet' },
          { id: 'a3', projectId: '1', name: 'Reviewer', role: 'reviewer', model: 'gpt-4o-mini' },
        ],
        documents: [],
        review: null,
      };

      useProjectStore.getState().setProjectData(mockData);

      const { writerProgress } = useProjectStore.getState();
      expect(writerProgress.a1).toBe('pending');
      expect(writerProgress.a2).toBe('pending');
      expect(writerProgress.a3).toBeUndefined();
    });

    it('should not set writerProgress for reviewers', () => {
      const mockData = {
        project: { id: '1', title: 'Test', idea: 'Idea', docType: 'prd', status: 'idle', createdAt: new Date(), updatedAt: new Date() },
        agents: [
          { id: 'a1', projectId: '1', name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { id: 'a2', projectId: '1', name: 'Reviewer', role: 'reviewer', model: 'gpt-4o-mini' },
        ],
        documents: [],
        review: null,
      };

      useProjectStore.getState().setProjectData(mockData);

      const { writerProgress } = useProjectStore.getState();
      expect(writerProgress).toHaveProperty('a1');
      expect(writerProgress).not.toHaveProperty('a2');
    });
  });

  describe('setWriterProgress', () => {
    it('should update writer progress for specific agent', () => {
      useProjectStore.getState().setProjectData({
        project: { id: '1', title: 'Test', idea: 'Idea', docType: 'prd', status: 'idle', createdAt: new Date(), updatedAt: new Date() },
        agents: [{ id: 'a1', projectId: '1', name: 'Writer 1', role: 'writer', model: 'gpt-4o' }],
        documents: [],
        review: null,
      });

      useProjectStore.getState().setWriterProgress('a1', 'streaming');

      expect(useProjectStore.getState().writerProgress.a1).toBe('streaming');
    });

    it('should preserve other writers progress', () => {
      useProjectStore.getState().setProjectData({
        project: { id: '1', title: 'Test', idea: 'Idea', docType: 'prd', status: 'idle', createdAt: new Date(), updatedAt: new Date() },
        agents: [
          { id: 'a1', projectId: '1', name: 'Writer 1', role: 'writer', model: 'gpt-4o' },
          { id: 'a2', projectId: '1', name: 'Writer 2', role: 'writer', model: 'claude-3-5-sonnet' },
        ],
        documents: [],
        review: null,
      });

      useProjectStore.getState().setWriterProgress('a1', 'streaming');
      useProjectStore.getState().setWriterProgress('a2', 'done');

      const { writerProgress } = useProjectStore.getState();
      expect(writerProgress.a1).toBe('streaming');
      expect(writerProgress.a2).toBe('done');
    });
  });

  describe('setIsGenerating', () => {
    it('should set isGenerating to true', () => {
      useProjectStore.getState().setIsGenerating(true);
      expect(useProjectStore.getState().isGenerating).toBe(true);
    });

    it('should set isGenerating to false', () => {
      useProjectStore.getState().setIsGenerating(true);
      useProjectStore.getState().setIsGenerating(false);
      expect(useProjectStore.getState().isGenerating).toBe(false);
    });
  });

  describe('updateDocumentContent', () => {
    it('should update document content', () => {
      const doc = { id: 'd1', projectId: '1', agentId: 'a1', content: '', type: 'doc', status: 'streaming', createdAt: new Date(), updatedAt: new Date() };
      useProjectStore.setState({ documents: [doc] });

      useProjectStore.getState().updateDocumentContent('d1', 'New content');

      expect(useProjectStore.getState().documents[0].content).toBe('New content');
    });

    it('should not modify other documents', () => {
      const doc1 = { id: 'd1', projectId: '1', agentId: 'a1', content: 'Original 1', type: 'doc', status: 'done', createdAt: new Date(), updatedAt: new Date() };
      const doc2 = { id: 'd2', projectId: '1', agentId: 'a2', content: 'Original 2', type: 'doc', status: 'done', createdAt: new Date(), updatedAt: new Date() };
      useProjectStore.setState({ documents: [doc1, doc2] });

      useProjectStore.getState().updateDocumentContent('d1', 'Updated');

      const docs = useProjectStore.getState().documents;
      expect(docs[0].content).toBe('Updated');
      expect(docs[1].content).toBe('Original 2');
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      useProjectStore.setState({
        project: { id: '1', title: 'Test', idea: 'Idea', docType: 'prd', status: 'idle', createdAt: new Date(), updatedAt: new Date() },
        agents: [{ id: 'a1', projectId: '1', name: 'Writer 1', role: 'writer', model: 'gpt-4o' }],
        documents: [{ id: 'd1', projectId: '1', agentId: 'a1', content: 'content', type: 'doc', status: 'done', createdAt: new Date(), updatedAt: new Date() }],
        review: { id: 'r1', projectId: '1', payload: '{}', createdAt: new Date() },
        isGenerating: true,
        writerProgress: { a1: 'done' },
      });

      useProjectStore.getState().reset();

      const state = useProjectStore.getState();
      expect(state.project).toBeNull();
      expect(state.agents).toEqual([]);
      expect(state.documents).toEqual([]);
      expect(state.review).toBeNull();
      expect(state.isGenerating).toBe(false);
      expect(state.writerProgress).toEqual({});
    });
  });
});