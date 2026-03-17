// TonBrain SDK — Task Router
import { Logger } from '../utils/logger.js';
import { AgentRegistry } from './registry.js';
import { AgentProtocol, type TaskRequest, type TaskResponse } from './protocol.js';
import { EscrowManager } from '../payments/escrow.js';
import { randomUUID } from 'crypto';

export interface RoutedTask {
  id: string;
  request: TaskRequest;
  assignedAgent?: string;
  status: 'pending' | 'routed' | 'accepted' | 'in_progress' | 'completed' | 'failed';
  result?: TaskResponse;
  createdAt: number;
  completedAt?: number;
}

/**
 * TaskRouter — Routes tasks to the best available agent and manages execution.
 * 
 * Combines the AgentRegistry (discovery) with the AgentProtocol (communication)
 * and EscrowManager (payment) to create a complete task delegation flow:
 * 
 * 1. Receive task request
 * 2. Find best agent via registry
 * 3. Negotiate payment terms
 * 4. Create escrow (if needed)
 * 5. Route task and await completion
 * 6. Release payment on success
 */
export class TaskRouter {
  private tasks: Map<string, RoutedTask> = new Map();
  private logger: Logger;

  constructor(
    private registry: AgentRegistry,
    private protocol: AgentProtocol,
    private escrow: EscrowManager
  ) {
    this.logger = new Logger('TaskRouter');
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle task responses
    this.protocol.on('task_response', (msg) => {
      const response = msg.payload as unknown as TaskResponse;
      const task = Array.from(this.tasks.values()).find(t => t.assignedAgent === msg.from);
      if (task) {
        task.result = response;
        task.status = response.status === 'completed' ? 'completed' : 'failed';
        task.completedAt = Date.now();
        this.logger.info(`Task ${task.id} ${task.status}`, { agent: msg.from });
      }
    });
  }

  /**
   * Route a task to the best available agent
   */
  async routeTask(request: TaskRequest): Promise<RoutedTask> {
    const task: RoutedTask = {
      id: randomUUID(),
      request,
      status: 'pending',
      createdAt: Date.now(),
    };
    this.tasks.set(task.id, task);

    // Find best agent
    const agent = this.registry.findBest(request.capability);
    if (!agent) {
      task.status = 'failed';
      this.logger.warn(`No agent found for capability: ${request.capability}`);
      return task;
    }

    task.assignedAgent = agent.id;
    task.status = 'routed';

    // Send task request via protocol
    this.protocol.requestTask(agent.id, request);
    this.logger.info(`Task ${task.id} routed to ${agent.name}`, {
      capability: request.capability,
    });

    return task;
  }

  /**
   * Get task by ID
   */
  getTask(id: string): RoutedTask | undefined {
    return this.tasks.get(id);
  }

  /**
   * List all tasks
   */
  listTasks(filter?: { status?: string }): RoutedTask[] {
    let results = Array.from(this.tasks.values());
    if (filter?.status) {
      results = results.filter(t => t.status === filter.status);
    }
    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get router statistics
   */
  getStats(): { total: number; completed: number; failed: number; pending: number } {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      pending: tasks.filter(t => ['pending', 'routed', 'accepted', 'in_progress'].includes(t.status)).length,
    };
  }
}
