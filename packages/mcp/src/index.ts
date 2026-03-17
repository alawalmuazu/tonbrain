#!/usr/bin/env node
// TonBrain MCP Server — Expose AI Agent tools to Claude Desktop, Cursor, VS Code
// Usage:
//   npx tonbrain-mcp                    # stdio mode (default)
//   npx tonbrain-mcp --http             # HTTP mode (port 3000)
//   npx tonbrain-mcp --http 8080        # HTTP mode (custom port)

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TonBrainAgent } from 'tonbrain-sdk';
import dotenv from 'dotenv';

dotenv.config();

// ── Tool Definitions ──

const TOOLS = [
  // Wallet Tools
  {
    name: 'ton_get_balance',
    description: 'Get TON balance and jetton token balances for a wallet address on the TON blockchain',
    inputSchema: {
      type: 'object' as const,
      properties: {
        address: { type: 'string', description: 'TON wallet address (EQ... or UQ...)' },
      },
      required: ['address'],
    },
  },
  {
    name: 'ton_get_transactions',
    description: 'Get recent transaction history for a TON wallet address',
    inputSchema: {
      type: 'object' as const,
      properties: {
        address: { type: 'string', description: 'TON wallet address' },
        limit: { type: 'number', description: 'Number of transactions to return (default: 10)' },
      },
      required: ['address'],
    },
  },
  {
    name: 'ton_get_nfts',
    description: 'Get NFTs owned by a TON wallet address with metadata and collection info',
    inputSchema: {
      type: 'object' as const,
      properties: {
        address: { type: 'string', description: 'TON wallet address' },
      },
      required: ['address'],
    },
  },
  {
    name: 'ton_get_jettons',
    description: 'Get all jetton (fungible token) balances for a TON wallet',
    inputSchema: {
      type: 'object' as const,
      properties: {
        address: { type: 'string', description: 'TON wallet address' },
      },
      required: ['address'],
    },
  },
  {
    name: 'ton_resolve_dns',
    description: 'Resolve a .ton domain name to a wallet address using TON DNS',
    inputSchema: {
      type: 'object' as const,
      properties: {
        domain: { type: 'string', description: 'TON domain name (e.g., "alice.ton")' },
      },
      required: ['domain'],
    },
  },

  // Payment Tools
  {
    name: 'ton_create_invoice',
    description: 'Create a payment invoice with a ton:// deep link for receiving TON payments',
    inputSchema: {
      type: 'object' as const,
      properties: {
        recipient: { type: 'string', description: 'Recipient wallet address' },
        amount: { type: 'string', description: 'Amount in TON' },
        description: { type: 'string', description: 'Invoice description' },
      },
      required: ['recipient', 'amount'],
    },
  },
  {
    name: 'ton_create_escrow',
    description: 'Create an escrow payment between two parties with funds held until task completion',
    inputSchema: {
      type: 'object' as const,
      properties: {
        payer: { type: 'string', description: 'Payer agent name or address' },
        payee: { type: 'string', description: 'Payee agent name or address' },
        amount: { type: 'string', description: 'Escrow amount in TON' },
        description: { type: 'string', description: 'Payment description' },
      },
      required: ['payer', 'payee', 'amount'],
    },
  },
  {
    name: 'ton_escrow_action',
    description: 'Perform an action on an existing escrow: fund, release, cancel, or dispute',
    inputSchema: {
      type: 'object' as const,
      properties: {
        escrowId: { type: 'string', description: 'Escrow payment ID' },
        action: {
          type: 'string',
          enum: ['fund', 'release', 'cancel', 'dispute'],
          description: 'Action to perform',
        },
        txHash: { type: 'string', description: 'Transaction hash (required for fund action)' },
      },
      required: ['escrowId', 'action'],
    },
  },
  {
    name: 'ton_split_payment',
    description: 'Create a proportional payment split across multiple recipients',
    inputSchema: {
      type: 'object' as const,
      properties: {
        totalAmount: { type: 'string', description: 'Total amount to split in TON' },
        recipients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              address: { type: 'string', description: 'Recipient address' },
              share: { type: 'number', description: 'Share in basis points (10000 = 100%)' },
            },
          },
          description: 'List of recipients with their share proportions',
        },
      },
      required: ['totalAmount', 'recipients'],
    },
  },

  // Agent Coordination Tools
  {
    name: 'ton_register_agent',
    description: 'Register an AI agent with capabilities in the TonBrain agent registry',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Agent name' },
        description: { type: 'string', description: 'What this agent does' },
        walletAddress: { type: 'string', description: 'Agent TON wallet address' },
        capabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Capability name' },
              description: { type: 'string', description: 'What this capability does' },
              costPerCall: { type: 'string', description: 'Cost per call in TON' },
            },
          },
        },
      },
      required: ['name', 'walletAddress', 'capabilities'],
    },
  },
  {
    name: 'ton_discover_agents',
    description: 'Find AI agents with specific capabilities in the registry',
    inputSchema: {
      type: 'object' as const,
      properties: {
        capability: { type: 'string', description: 'Capability name to search for' },
      },
      required: ['capability'],
    },
  },
  {
    name: 'ton_route_task',
    description: 'Route a task to the best available agent based on capability and cost',
    inputSchema: {
      type: 'object' as const,
      properties: {
        capability: { type: 'string', description: 'Required capability' },
        input: { type: 'string', description: 'Task input data as JSON string' },
      },
      required: ['capability'],
    },
  },
  {
    name: 'ton_agent_status',
    description: 'Get the current status of the TonBrain agent including wallet, registry, and router stats',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

// ── Server Setup ──

const server = new Server(
  {
    name: 'tonbrain-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Lazy-initialize agent
let agent: TonBrainAgent | null = null;

function getAgent(): TonBrainAgent {
  if (!agent) {
    agent = new TonBrainAgent({
      network: (process.env.NETWORK as 'mainnet' | 'testnet') || 'testnet',
    });
  }
  return agent;
}

// ── List Tools ──

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// ── Call Tool ──

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = getAgent();

  try {
    switch (name) {
      // ── Wallet Tools ──
      case 'ton_get_balance': {
        await a.initialize(args?.address as string);
        const balance = await a.wallet.getBalance();
        const jettons = await a.wallet.getJettons();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              address: args?.address,
              ton: balance,
              jettons: jettons.slice(0, 20),
              network: a.config.network,
            }, null, 2),
          }],
        };
      }

      case 'ton_get_transactions': {
        await a.initialize(args?.address as string);
        const txs = await a.wallet.getTransactions(
          undefined,
          (args?.limit as number) || 10
        );
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(txs, null, 2),
          }],
        };
      }

      case 'ton_get_nfts': {
        await a.initialize(args?.address as string);
        const nfts = await a.wallet.getNFTs();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(nfts, null, 2),
          }],
        };
      }

      case 'ton_get_jettons': {
        await a.initialize(args?.address as string);
        const jettons = await a.wallet.getJettons();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(jettons, null, 2),
          }],
        };
      }

      case 'ton_resolve_dns': {
        await a.initialize();
        const resolved = await a.wallet.resolveDNS(args?.domain as string);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ domain: args?.domain, resolvedAddress: resolved }, null, 2),
          }],
        };
      }

      // ── Payment Tools ──
      case 'ton_create_invoice': {
        const invoice = a.invoices.create({
          recipient: args?.recipient as string,
          amount: args?.amount as string,
          description: (args?.description as string) || '',
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(invoice, null, 2),
          }],
        };
      }

      case 'ton_create_escrow': {
        const escrow = a.escrow.create({
          payer: args?.payer as string,
          payee: args?.payee as string,
          amount: args?.amount as string,
          description: (args?.description as string) || '',
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(escrow, null, 2),
          }],
        };
      }

      case 'ton_escrow_action': {
        const escrowId = args?.escrowId as string;
        const action = args?.action as string;
        let result;

        switch (action) {
          case 'fund':
            result = await a.escrow.fund(escrowId, args?.txHash as string);
            break;
          case 'release':
            result = await a.escrow.release(escrowId);
            break;
          case 'cancel':
            result = await a.escrow.refund(escrowId);
            break;
          case 'dispute':
            result = a.escrow.dispute(escrowId);
            break;
          default:
            throw new Error(`Unknown escrow action: ${action}`);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ escrowId, action, result }, null, 2),
          }],
        };
      }

      case 'ton_split_payment': {
        const split = a.splitter.createProportional({
          totalAmount: args?.totalAmount as string,
          recipients: (args?.recipients as Array<{ address: string; share: number }>) || [],
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(split, null, 2),
          }],
        };
      }

      // ── Agent Coordination Tools ──
      case 'ton_register_agent': {
        const rawCaps = (args?.capabilities as Array<{
          name: string;
          description?: string;
          costPerCall?: string;
        }>) || [];
        const registration = a.registry.register({
          name: args?.name as string,
          description: (args?.description as string) || '',
          walletAddress: args?.walletAddress as string,
          capabilities: rawCaps.map(c => ({
            name: c.name,
            description: c.description || c.name,
            costPerCall: c.costPerCall,
          })),
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(registration, null, 2),
          }],
        };
      }

      case 'ton_discover_agents': {
        const agents = a.registry.findByCapability(args?.capability as string);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(agents, null, 2),
          }],
        };
      }

      case 'ton_route_task': {
        const inputStr = (args?.input as string) || '{}';
        let inputObj: Record<string, unknown> = {};
        try { inputObj = JSON.parse(inputStr); } catch { inputObj = { raw: inputStr }; }
        const routed = await a.router.routeTask({
          capability: args?.capability as string,
          input: inputObj,
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(routed, null, 2),
          }],
        };
      }

      case 'ton_agent_status': {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(a.getStatus(), null, 2),
          }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
});

// ── Start Server ──

async function main() {
  const args = process.argv.slice(2);
  const isHttp = args.includes('--http');

  if (isHttp) {
    // HTTP mode for remote connections
    const portArg = args[args.indexOf('--http') + 1];
    const port = portArg ? parseInt(portArg, 10) : 3000;
    console.error(`🧠 TonBrain MCP Server starting on http://localhost:${port}/mcp`);
    // For HTTP mode, we'd use StreamableHTTPServerTransport
    // For now, default to stdio which works with all MCP clients
    console.error('HTTP mode requires @modelcontextprotocol/sdk StreamableHTTPServerTransport');
    console.error('Falling back to stdio mode...');
  }

  console.error('🧠 TonBrain MCP Server v1.0.0');
  console.error(`📡 Network: ${process.env.NETWORK || 'testnet'}`);
  console.error('🔌 Transport: stdio');
  console.error('');
  console.error('Tools available:');
  TOOLS.forEach(t => console.error(`  • ${t.name} — ${t.description.slice(0, 60)}...`));
  console.error('');
  console.error('Ready for connections from Claude Desktop, Cursor, VS Code...');

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
