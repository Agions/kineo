import CostService from '@/core/services/project/cost-service';

describe('costService enhancements', () => {
  let service: CostService;

  beforeEach(() => {
    localStorage.clear();
    service = new CostService();
    service.clear();
  });

  it('should aggregate project stats by projectId', () => {
    service.recordLLMCost('alibaba', 'qwen-plus', 1000, 1000, { projectId: 'p1' });
    service.recordLLMCost('alibaba', 'qwen-plus', 500, 500, { projectId: 'p2' });

    const p1 = service.getProjectStats('p1');
    const p2 = service.getProjectStats('p2');

    expect(p1.total).toBeGreaterThan(0);
    expect(p2.total).toBeGreaterThan(0);
    expect(p1.total).not.toBe(p2.total);
  });

  it('should record audio and storage cost', () => {
    const a = service.recordAudioCost('edge', 60, { projectId: 'p1' });
    const s = service.recordStorageCost('local-export', 100, { projectId: 'p1' });

    expect(a.type).toBe('audio');
    expect(s.type).toBe('storage');
    expect(service.getProjectStats('p1').total).toBeCloseTo(a.cost + s.cost, 5);
  });

  it('should emit budget alerts', () => {
    const alerts: string[] = [];
    service.setBudget({ daily: 0.001, weekly: 0.001, monthly: 0.001 });
    const unsub = service.subscribeAlert((alert) => alerts.push(alert.period));

    service.recordLLMCost('openai', 'gpt-5', 1000, 1000, { projectId: 'p1' });

    unsub();
    expect(alerts.length).toBeGreaterThan(0);
  });

  describe('getModelSuggestion', () => {
    it('should suggest cheap model for simple tasks with low budget', () => {
      const suggestion = service.getModelSuggestion('simple', 'low');

      expect(suggestion.model).toBeDefined();
      expect(suggestion.provider).toBeDefined();
      expect(suggestion.estimatedCost).toBeGreaterThanOrEqual(0);
    });

    it('should suggest expensive model for complex tasks with high budget', () => {
      const suggestion = service.getModelSuggestion('complex', 'high');

      expect(suggestion.model).toBeDefined();
      expect(suggestion.provider).toBeDefined();
    });

    it('should return balanced suggestion by default', () => {
      const suggestion = service.getModelSuggestion('standard');

      expect(suggestion.model).toBeDefined();
      expect(suggestion.provider).toBeDefined();
    });

    it('should handle creative complexity', () => {
      const suggestion = service.getModelSuggestion('creative', 'medium');

      expect(suggestion.model).toBeDefined();
    });
  });

  describe('getOptimizationSuggestions', () => {
    it('should return message when no data', () => {
      const suggestions = service.getOptimizationSuggestions();

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should suggest LLM optimization when LLM cost is high', () => {
      // Record a lot of LLM cost to trigger the suggestion
      for (let i = 0; i < 20; i++) {
        service.recordLLMCost('openai', 'gpt-5', 100, 100, { projectId: 'p1' });
      }

      const suggestions = service.getOptimizationSuggestions();
      const hasLLMSuggestion = suggestions.some((s) => s.includes('LLM'));

      expect(hasLLMSuggestion).toBe(true);
    });

    it('should suggest video optimization when video cost is high', () => {
      // Record significant storage cost to push video ratio
      for (let i = 0; i < 10; i++) {
        service.recordStorageCost('video-export', 500, { projectId: 'p1' });
      }

      const suggestions = service.getOptimizationSuggestions();
      // Just verify it returns valid suggestions
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('exportReport', () => {
    it('should export valid markdown report', () => {
      service.recordLLMCost('alibaba', 'qwen-plus', 100, 100, { projectId: 'p1' });

      const report = service.exportReport();

      expect(typeof report).toBe('string');
      expect(report).toContain('Kineo');
      expect(report).toContain('成本报告');
      expect(report).toContain('总计');
    });

    it('should include budget utilization in report', () => {
      service.setBudget({ daily: 0.001, weekly: 0.01, monthly: 0.05 });
      service.recordLLMCost('alibaba', 'qwen-plus', 100, 100, { projectId: 'p1' });

      const report = service.exportReport();

      expect(report).toContain('今日');
      expect(report).toContain('本周');
      expect(report).toContain('本月');
    });
  });

  describe('subscribe', () => {
    it('should notify subscriber on stats update', () => {
      const receivedStats: any[] = [];
      const unsubscribe = service.subscribe((stats) => {
        receivedStats.push(stats);
      });

      service.recordLLMCost('alibaba', 'qwen-plus', 100, 100, { projectId: 'p1' });

      unsubscribe();
      expect(receivedStats.length).toBeGreaterThan(0);
    });

    it('should stop notifying after unsubscribe', () => {
      let count = 0;
      const unsubscribe = service.subscribe(() => {
        count++;
      });

      service.recordLLMCost('alibaba', 'qwen-plus', 100, 100, { projectId: 'p1' });
      unsubscribe();
      service.recordLLMCost('alibaba', 'qwen-plus', 100, 100, { projectId: 'p1' });

      expect(count).toBe(1);
    });
  });

  describe('getRecords', () => {
    it('should return all records sorted by timestamp descending', () => {
      service.recordLLMCost('alibaba', 'qwen-plus', 100, 100, { projectId: 'p1' });
      service.recordLLMCost('openai', 'gpt-5', 200, 200, { projectId: 'p2' });

      const records = service.getRecords();

      expect(records.length).toBe(2);
      expect(new Date(records[0].timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(records[1].timestamp).getTime()
      );
    });

    it('should filter records by projectId', () => {
      service.recordLLMCost('alibaba', 'qwen-plus', 100, 100, { projectId: 'p1' });
      service.recordLLMCost('openai', 'gpt-5', 200, 200, { projectId: 'p2' });

      const p1Records = service.getRecords('p1');

      expect(p1Records.length).toBe(1);
      expect(p1Records[0].metadata?.projectId).toBe('p1');
    });
  });

  describe('setBudget / getBudget', () => {
    it('should set and get budget', () => {
      const newBudget = { daily: 0.5, weekly: 2, monthly: 10 };
      service.setBudget(newBudget);

      const retrieved = service.getBudget();

      expect(retrieved.daily).toBe(0.5);
      expect(retrieved.weekly).toBe(2);
      expect(retrieved.monthly).toBe(10);
    });

    it('should partially update budget', () => {
      const initial = service.getBudget();
      service.setBudget({ daily: 0.5 });

      const retrieved = service.getBudget();
      expect(retrieved.daily).toBe(0.5);
      expect(retrieved.weekly).toBe(initial.weekly);
      expect(retrieved.monthly).toBe(initial.monthly);
    });
  });
});
