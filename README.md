# ETL-D MCP Server 🌊

[![npm version](https://img.shields.io/npm/v/etld-mcp-server?color=blue)](https://www.npmjs.com/package/etld-mcp-server)
[![PyPI version](https://img.shields.io/pypi/v/etld?color=blue)](https://pypi.org/project/etld/)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-Official-success)](https://registry.modelcontextprotocol.io/pablixnieto2/etld-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**ETL-D** is a deterministic data middleware designed to act as a shield for AI Agents. It stops LLMs from "hallucinating" over structured data by providing a strict, 3-layer parsing architecture via the Model Context Protocol (MCP).

## ⚠️ The Problem: The "Data Tax" & Hallucinations

Standard LLMs are terrible at reading raw B2B files (CSV, PDF, EDI, Norma 43). They suffer from:
1. **Token Exhaustion:** Sending a 5,000-row CSV to context is a waste of money.
2. **Precision Loss:** LLMs struggle with spatial alignment. A misplaced comma in a bank statement is a financial catastrophe.
3. **Non-Determinism:** You can't build a reliable pipeline if the output format depends on the LLM's "mood."

## ✅ The Solution: 3-Layer Waterfall Architecture

The ETL-D engine processes every request through a strict hierarchy:
* **Layer 1 (Heuristic):** 100% Python-native deterministic parsers. 0% Hallucination risk. ~70ms latency.
* **Layer 2 (Semantic):** Column-to-Schema alignment using embedding-based routing.
* **Layer 3 (LLM Shield):** Strict JSON enforcement using Llama 3.3 70B with `additionalProperties: false` constraints for high-entropy noise.

---

## 🚀 Quick Start (Claude Desktop)

1. Open your `claude_desktop_config.json`.
2. Add the **ETL-D** server (Ensure you use version `3.2.3`):

```json
{
  "mcpServers": {
    "etld": {
      "command": "npx",
      "args": [
        "-y",
        "@pablixnieto2/etld-mcp-server@3.2.3"
      ],
      "env": {
        "ETLD_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

## 🔑 How to Get an API Key?
* **Option A:** Manual Purchase (Human)
Get a Starter Pack ($5 / 5,000 credits) or a Subscription at api.etl-d.net.

* **Option B:** Zero-Touch Provisioning (Agent-Led) 🤖
If you don't have a key, simply ask Claude: "I don't have an ETL-D key, can you help me get one?".
The agent will call the /provision tool, generate a Stripe Checkout link for you, and automatically set up the key once paid. Zero-touch, human-in-the-loop.

## 🛠️ Available MCP Tools
1. Financial & B2B Heavy Lifting
parse_bank_statement: Support for Spanish Norma 43 (N43). Turns raw bank files into clean JSON.

parse_trade_history: Deterministic extraction of trades, fees, and dividends from complex broker exports.

parse_edi: ANSI X12 EDI parser (Optimized for 850 Purchase Orders).

generate_sepa_xml: JSON to PAIN.008 (Direct Debit) XML generator.

2. Document Intelligence
pdf_to_spatial_markdown: Crucial for Agents. Converts PDFs to Markdown preserving table structures before the LLM reads them.

extract_invoice / extract_resume: High-accuracy schema extraction for standard B2B documents.

3. Atomic Enrichment (1 Credit/call)
enrich_amount: Cleans "Total: 1.240,50€" into {amount: 1240.50, currency: "EUR"}.

enrich_date: Resolves human-readable dates ("next Friday at 5pm") with Timezone awareness.

enrich_address: Standardizes global messy addresses into structured components.

accounting_map: Maps concepts to ES PGC, US GAAP, or IFRS.

## 🏗️ Ecosystem
Cloud Engine: Hosted at api.etl-d.net (Python/FastAPI).

Python SDK: pip install etld.

n8n Nodes: Available in the n8n community as n8n-nodes-etld.

## ⚖️ License
MIT - Created by Pablixnieto2
