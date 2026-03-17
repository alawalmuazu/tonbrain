// TonBrain SDK — Agent Registry (Agent Discovery & Registration)
import { Logger } from '../utils/logger.js';
import { CoordinationError } from '../utils/errors.js';
import { randomUUID } from 'crypto';

export interface AgentCapability {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  costPerCall?: string; // In TON
  avgLatencyMs?: number;
}

export interface AgentRegistration {
  id: string;
  name: string;
  description: string;
  walletAddress: string;
  capabilities: AgentCapability[];
  status: 'online' | 'offline' | 'busy';
  registeredAt: number;
  lastHeartbeat: number;
  metadata?: Record<string, unknown>;
}

/**
 * AgentRegistry — Discovery and registration for multi-agent systems on TON.
 * 
 * Agents register their capabilities, wallet addresses, and pricing.
 * Other agents can discover and delegate tasks based on capability matching.
 * This is the foundational coordination primitive for agent-to-agent
 * interactions with TON as the payment and trust layer.
 */
export class AgentRegistry {
  private agents: Map<string, AgentRegistration> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger('AgentRegistry');
  }

  /**
   * Register a new agent with its capabilities
   */
  register(params: {
    name: string;
    description: string;
    walletAddress: string;
    capabilities: AgentCapability[];
    metadata?: Record<string, unknown>;
  }): AgentRegistration {
    const agent: AgentRegistration = {
      id: randomUUID(),
      name: params.name,
      description: params.description,
      walletAddress: params.walletAddress,
      capabilities: params.capabilities,
      status: 'online',
      registeredAt: Date.now(),
      lastHeartbeat: Date.now(),
      metadata: params.metadata,
    };

    this.agents.set(agent.id, agent);
    this.logger.info(`Agent registered: ${agent.name} (${agent.id})`, {
      capabilities: agent.capabilities.map(c => c.name),
    });

    return agent;
  }

  /**
   * Update agent heartbeat (keep alive)
   */
  heartbeat(agentId: string): void {
    const agent = this.getAgent(agentId);
    agent.lastHeartbeat = Date.now();
    agent.status = 'online';
  }

  /**
   * Set agent status
   */
  setStatus(agentId: string, status: 'online' | 'offline' | 'busy'): void {
    const agent = this.getAgent(agentId);
    agent.status = status;
  }

  /**
   * Unregister an agent
   */
  unregister(agentId: string): void {
    if (!this.agents.has(agentId)) {
      throw new CoordinationError(`Agent not found: ${agentId}`);
    }
    this.agents.delete(agentId);
    this.logger.info(`Agent unregistered: ${agentId}`);
  }

  /**
   * Find agents by capability name
   */
  findByCapability(capabilityName: string): AgentRegistration[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.status === 'online' &&
      agent.capabilities.some(c =>
        c.name.toLowerCase().includes(capabilityName.toLowerCase())
      )
    );
  }

  /**
   * Find the best agent for a given task (cheapest + available)
   */
  findBest(capabilityName: string): AgentRegistration | null {
    const candidates = this.findByCapability(capabilityName);
    if (candidates.length === 0) return null;

    // Sort by cost (cheapest first), then by latency
    return candidates.sort((a, b) => {
      const aCap = a.capabilities.find(c => c.name.includes(capabilityName));
      const bCap = b.capabilities.find(c => c.name.includes(capabilityName));
      const aCost = Number(aCap?.costPerCall ?? Infinity);
      const bCost = Number(bCap?.costPerCall ?? Infinity);
      if (aCost !== bCost) return aCost - bCost;
      return (aCap?.avgLatencyMs ?? Infinity) - (bCap?.avgLatencyMs ?? Infinity);
    })[0];
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): AgentRegistration {
    const agent = this.agents.get(id);
    if (!agent) throw new CoordinationError(`Agent not found: ${id}`);
    return agent;
  }

  /**
   * List all registered agents
   */
  listAgents(filter?: { status?: string }): AgentRegistration[] {
    let results = Array.from(this.agents.values());
    if (filter?.status) {
      results = results.filter(a => a.status === filter.status);
    }
    return results;
  }

  /**
   * Mark stale agents as offline (no heartbeat for 5 minutes)
   */
  pruneStale(timeoutMs: number = 5 * 60 * 1000): number {
    let count = 0;
    for (const agent of this.agents.values()) {
      if (agent.status === 'online' && Date.now() - agent.lastHeartbeat > timeoutMs) {
        agent.status = 'offline';
        count++;
      }
    }
    return count;
  }

  /**
   * Get registry stats
   */
  getStats(): { total: number; online: number; capabilities: number } {
    const agents = Array.from(this.agents.values());
    const allCaps = new Set(agents.flatMap(a => a.capabilities.map(c => c.name)));
    return {
      total: agents.length,
      online: agents.filter(a => a.status === 'online').length,
      capabilities: allCaps.size,
    };
  }
}
