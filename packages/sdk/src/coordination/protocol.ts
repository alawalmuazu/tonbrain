// TonBrain SDK — Agent-to-Agent Communication Protocol
import { Logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

export type MessageType = 'task_request' | 'task_response' | 'payment_terms' | 'payment_confirm' | 'heartbeat' | 'error';

export interface AgentMessage {
  id: string;
  type: MessageType;
  from: string; // Agent ID
  to: string;   // Agent ID
  timestamp: number;
  payload: Record<string, unknown>;
  replyTo?: string; // ID of the message this is replying to
  signature?: string; // Future: cryptographic signature
}

export interface TaskRequest {
  capability: string;
  input: Record<string, unknown>;
  maxBudget?: string; // Max TON willing to pay
  deadline?: number;  // Unix timestamp
}

export interface TaskResponse {
  requestId: string;
  status: 'accepted' | 'rejected' | 'completed' | 'failed';
  output?: Record<string, unknown>;
  cost?: string;
  error?: string;
}

export interface PaymentTerms {
  requestId: string;
  amount: string;
  token: string;
  paymentMethod: 'direct' | 'escrow';
  escrowId?: string;
}

/**
 * AgentProtocol — Structured communication between AI agents on TON.
 * 
 * Implements a simple request/response pattern with payment negotiation:
 * 1. Agent A sends task_request to Agent B
 * 2. Agent B responds with payment_terms (how much it costs)
 * 3. Agent A confirms payment (via escrow or direct transfer)
 * 4. Agent B executes the task and sends task_response
 * 
 * This protocol enables autonomous agent-to-agent interactions
 * with TON as the settlement layer.
 */
export class AgentProtocol {
  private inbox: Map<string, AgentMessage[]> = new Map();
  private outbox: Map<string, AgentMessage[]> = new Map();
  private handlers: Map<MessageType, Array<(msg: AgentMessage) => void>> = new Map();
  private logger: Logger;

  constructor(private agentId: string) {
    this.logger = new Logger(`Protocol:${agentId.slice(0, 8)}`);
  }

  /**
   * Send a message to another agent
   */
  send(to: string, type: MessageType, payload: Record<string, unknown>, replyTo?: string): AgentMessage {
    const message: AgentMessage = {
      id: randomUUID(),
      type,
      from: this.agentId,
      to,
      timestamp: Date.now(),
      payload,
      replyTo,
    };

    // Add to outbox
    if (!this.outbox.has(to)) this.outbox.set(to, []);
    this.outbox.get(to)!.push(message);

    this.logger.debug(`Sent ${type} to ${to.slice(0, 8)}`, { messageId: message.id });
    return message;
  }

  /**
   * Receive a message (called by the transport layer)
   */
  receive(message: AgentMessage): void {
    if (!this.inbox.has(message.from)) this.inbox.set(message.from, []);
    this.inbox.get(message.from)!.push(message);

    // Notify handlers
    const handlers = this.handlers.get(message.type) ?? [];
    handlers.forEach(h => h(message));

    this.logger.debug(`Received ${message.type} from ${message.from.slice(0, 8)}`);
  }

  /**
   * Register a handler for a message type
   */
  on(type: MessageType, handler: (msg: AgentMessage) => void): void {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type)!.push(handler);
  }

  /**
   * Send a task request
   */
  requestTask(toAgentId: string, request: TaskRequest): AgentMessage {
    return this.send(toAgentId, 'task_request', request as unknown as Record<string, unknown>);
  }

  /**
   * Respond to a task request
   */
  respondToTask(toAgentId: string, response: TaskResponse, replyTo: string): AgentMessage {
    return this.send(toAgentId, 'task_response', response as unknown as Record<string, unknown>, replyTo);
  }

  /**
   * Propose payment terms
   */
  proposePayment(toAgentId: string, terms: PaymentTerms, replyTo: string): AgentMessage {
    return this.send(toAgentId, 'payment_terms', terms as unknown as Record<string, unknown>, replyTo);
  }

  /**
   * Confirm payment
   */
  confirmPayment(toAgentId: string, payload: { termsId: string; txHash?: string; escrowId?: string }, replyTo: string): AgentMessage {
    return this.send(toAgentId, 'payment_confirm', payload, replyTo);
  }

  /**
   * Get conversation with a specific agent
   */
  getConversation(agentId: string): AgentMessage[] {
    const sent = this.outbox.get(agentId) ?? [];
    const received = this.inbox.get(agentId) ?? [];
    return [...sent, ...received].sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get all unread messages
   */
  getUnread(): AgentMessage[] {
    return Array.from(this.inbox.values()).flat();
  }

  getAgentId(): string {
    return this.agentId;
  }
}
