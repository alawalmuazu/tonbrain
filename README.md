<div align="center">

# 🧠 TonBrain

**The Native AI Agent Framework for TON Blockchain**

*Built for the [TON AI Agent Hackathon 2026](https://identityhub.app/contests/ai-hackathon)*

[![Live Bot](https://img.shields.io/badge/Try_it-@TonBrainAIBot-26A5E4?style=for-the-badge&logo=telegram)](https://t.me/TonBrainAIBot)
[![Track 1](https://img.shields.io/badge/Track_1-Agent_Infrastructure-0098EA?style=for-the-badge)](https://identityhub.app/contests/ai-hackathon)
[![Track 2](https://img.shields.io/badge/Track_2-User_Facing_Agent-00D4AA?style=for-the-badge)](https://identityhub.app/contests/ai-hackathon)
[![MCP](https://img.shields.io/badge/MCP-13_Tools-FF6B6B?style=for-the-badge)](https://modelcontextprotocol.io)
[![Gemini](https://img.shields.io/badge/Gemini_2.0-AI_Engine-8B5CF6?style=for-the-badge)](https://ai.google.dev)
[![TON](https://img.shields.io/badge/TON-Blockchain-0098EA?style=for-the-badge)](https://ton.org)

</div>

---

## 🎯 The Problem

> *"Zero of the top 20 AI bots transact on TON. The ecosystem has tooling but no cohesive framework."*
> — [Identity Hub Analysis](https://identityhub.app/blog/telegram-default-ai-interface)

Telegram has **1B+ monthly active users**, **183 AI bots** with 44.3M combined MAU. TON has payment rails, identity, and smart contracts.

**But there's no bridge between them.** No native framework for AI agents to operate on TON.

## 💡 The Solution: TonBrain

TonBrain is a **three-package monorepo** that provides infrastructure, tooling, and a production-ready AI agent:

| Package | Track | What It Does |
|---------|-------|-------------|
| `tonbrain-sdk` | 🔧 Agent Infrastructure | SDK with wallet management, escrow payments, invoicing, payment splitting, agent registry, task routing, and A2A protocol |
| `tonbrain-mcp` | 🔧 Agent Infrastructure | **MCP server with 13 tools** — plug into Claude Desktop, Cursor, VS Code for TON blockchain operations |
| `tonbrain-bot` | 🤖 User-Facing Agent | Telegram bot powered by Gemini 2.0 Flash — wallet, tokens, NFTs, swaps via natural language |

### 🏆 How TonBrain Scores on Judging Criteria

| Criteria (25% each) | How TonBrain Delivers |
|---------------------|----------------------|
| **Product Quality** | Production-grade bot with branded welcome, HTML-formatted messages, inline keyboards, typing indicators, 13 commands. Premium dark-theme landing page |
| **Technical Execution** | TypeScript monorepo, Gemini function calling, MCP server (13 tools), TON API integration, escrow state machine, agent coordination protocol |
| **Ecosystem Value** | Fills the exact gap: *"A native AI agent framework for TON"*. MCP server lets Claude/Cursor/VS Code interact with TON. Open-source SDK others can build on, aligned with `@ton/mcp` |
| **User Potential** | 1B+ Telegram users interact with TON via natural language. Developers get MCP tools for Claude Desktop. No app downloads, no seed phrases |

---

## 🔌 MCP Server — `tonbrain-mcp`

**The key differentiator**: TonBrain exposes its SDK as an MCP server, letting any AI application interact with TON.

### Quick Start

```json
// Claude Desktop / Cursor config
{
  "mcpServers": {
    "tonbrain": {
      "command": "npx",
      "args": ["-y", "tonbrain-mcp"],
      "env": { "NETWORK": "testnet" }
    }
  }
}
```

### 13 MCP Tools

| Category | Tools |
|----------|-------|
| 🔑 **Wallet** | `ton_get_balance`, `ton_get_transactions`, `ton_get_nfts`, `ton_get_jettons`, `ton_resolve_dns` |
| 💰 **Payments** | `ton_create_invoice`, `ton_create_escrow`, `ton_escrow_action`, `ton_split_payment` |
| 🤖 **Coordination** | `ton_register_agent`, `ton_discover_agents`, `ton_route_task`, `ton_agent_status` |

**Example prompts in Claude Desktop:**
- *"Check the balance of EQBvW8Z5huBkMJYdnfAEM5JqTNkuFX3PNx..."*
- *"Create an escrow for 5 TON between AgentA and AgentB"*
- *"Register a translation agent with cost 0.01 TON"*
- *"Route a translate task to the cheapest available agent"*

---

## 🤖 Try the Bot

**[@TonBrainAIBot](https://t.me/TonBrainAIBot)** — Open in Telegram and send `/start`

### Commands

| Command | Description |
|---------|-------------|
| `/start` | 🚀 Branded welcome with feature overview |
| `/wallet` | 💼 Wallet setup / view address |
| `/balance` | 💎 TON & Jetton balances |
| `/send` | 💸 Send TON via natural language |
| `/swap` | 🔄 DEX token swaps |
| `/nfts` | 🖼 NFT gallery |
| `/portfolio` | 📊 Full asset overview |
| `/invoice` | 📄 Create payment requests |
| `/demo` | 🎯 All capabilities at a glance |
| `/about` | ℹ️ Contest info & links |
| `/network` | 🌐 Switch mainnet/testnet |
| `/help` | ❓ Command reference |

**Natural Language**: *"What's my balance?"*, *"Show my NFTs"*, *"Send 1 TON to alice.ton"*

---

## 🚀 Quick Start

```bash
# Clone + install
git clone https://github.com/alawalmuazu/tonbrain.git && cd tonbrain
npm install

# Configure
cp .env.example .env
# Set TELEGRAM_BOT_TOKEN and GEMINI_API_KEY

# Run the bot
npm run dev:bot

# Run MCP server (stdio)
npm run dev:mcp
```

---

## 📦 Architecture

```
tonbrain/
├── packages/
│   ├── sdk/                    # Track 1: Agent Infrastructure SDK
│   │   └── src/
│   │       ├── core/           # TonBrainAgent, WalletManager, Config
│   │       ├── payments/       # Escrow state machine, Invoices, Splitter
│   │       ├── coordination/   # AgentRegistry, TaskRouter, A2A Protocol
│   │       └── utils/          # Logger, Typed errors
│   │
│   ├── mcp/                    # Track 1: MCP Server (13 tools)
│   │   └── src/
│   │       └── index.ts        # @modelcontextprotocol/sdk server
│   │
│   └── bot/                    # Track 2: Telegram AI Bot
│       └── src/
│           ├── ai/             # Gemini 2.0 Flash + function calling
│           ├── commands/       # 12 bot commands
│           ├── handlers/       # Callbacks + NL messages
│           ├── services/       # TON service layer
│           └── utils/          # DB, formatting, keyboards
│
└── web/                        # Landing page with live countdown
    └── index.html
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    TonBrain Ecosystem                        │
│                                                             │
│  Telegram User ──→ Grammy Bot ──→ Gemini AI (func calling)  │
│                                       ↓                     │
│  Claude/Cursor ──→ MCP Server ──→  TonBrain SDK             │
│                                       ↓                     │
│                                TON Blockchain API            │
│                             (Toncenter + TONAPI)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 SDK Usage

```typescript
import { TonBrainAgent } from 'tonbrain-sdk';

const agent = new TonBrainAgent({ network: 'testnet' });
await agent.initialize('EQ...');

// Wallet
const { balance } = await agent.wallet.getBalance();

// Escrow (Agent-to-Agent payment)
const escrow = agent.escrow.create({
  payer: 'AgentA', payee: 'AgentB',
  amount: '5.0', description: 'Data analysis',
});
await agent.escrow.fund(escrow.id, 'tx-hash');
await agent.escrow.release(escrow.id);

// Multi-agent coordination
agent.registry.register({
  name: 'TranslatorBot',
  description: 'AI translation agent',
  walletAddress: agent.wallet.getAddress(),
  capabilities: [{ name: 'translate', description: 'Text translation', costPerCall: '0.01' }],
});
const task = await agent.router.routeTask({ capability: 'translate', input: { text: 'Hello' } });
```

---

## 🛠 Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Runtime | Node.js 20 + TypeScript | Type safety, ecosystem maturity |
| MCP | @modelcontextprotocol/sdk | Official MCP protocol for AI tool integration |
| TON API | Toncenter + TONAPI v2 | Balance, transactions, jettons, NFTs |
| Telegram | Grammy (TypeScript-first) | Best DX, middleware support |
| AI | Google Gemini 2.0 Flash | Fast, function calling, free tier |
| Database | JSON file store (WAL-safe) | Zero dependencies, hackathon-appropriate |
| Validation | Zod | Runtime type safety |
| Build | tsup + tsx | Fast TS compilation |
| Monorepo | npm workspaces | Single repo, shared deps |

---

## 🔗 Links

| Resource | Link |
|----------|------|
| 🤖 **Live Bot** | [@TonBrainAIBot](https://t.me/TonBrainAIBot) |
| 🏆 **Hackathon** | [identityhub.app/contests/ai-hackathon](https://identityhub.app/contests/ai-hackathon) |
| 📖 **TON MCP Docs** | [docs.ton.org/ecosystem/ai/mcp](https://docs.ton.org/ecosystem/ai/mcp) |
| 🔌 **MCP Protocol** | [modelcontextprotocol.io](https://modelcontextprotocol.io) |
| 📊 **Ecosystem Analysis** | [Telegram AI Interface Blog](https://identityhub.app/blog/telegram-default-ai-interface) |
| 💎 **TON Foundation** | [ton.org](https://ton.org) |

---

## 📄 License

MIT — Build freely, build boldly.

---

<div align="center">

**Built with 🧠 for the TON AI Agent Hackathon 2026**

*The native AI agent framework TON has been missing.*

[Try the Bot →](https://t.me/TonBrainAIBot) · [View MCP Tools →](#-mcp-server--tonbrain-mcp) · [Contest →](https://identityhub.app/contests/ai-hackathon)

</div>
