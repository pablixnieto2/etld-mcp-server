# ETL-D MCP Server 🌊

[![npm version](https://img.shields.io/npm/v/@pablixnieto2/etld-mcp-server?color=blue)](https://www.npmjs.com/package/@pablixnieto2/etld-mcp-server)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-Official-success)](https://registry.modelcontextprotocol.io/pablixnieto2/etld-mcp-server)

A deterministic data middleware for AI agents, exposed as a standard Model Context Protocol (MCP) server.

## The Problem: The "Data Tax" in LLMs

Asking an LLM to parse a 10,000-row CSV, a Spanish Norma 43 bank statement, or an EDI 850 file directly in the context window leads to three major issues:
1. **Token Exhaustion:** Sending raw B2B formats to a context window is highly inefficient.
2. **Hallucinations:** LLMs struggle with strict spatial alignment and counting. A single misplaced comma in a financial trade history is catastrophic.
3. **Non-Determinism:** You cannot build reliable B2B pipelines if the extraction format changes based on the LLM's "mood."

## The Solution: Waterfall Architecture

ETL-D stops agents from attempting to "read" raw B2B data. Instead, the agent routes the file/string to this MCP server, which processes the data using a strict **3-Layer Waterfall Architecture**:

1. **L1 - Heuristic (0-Shot):** Standard Python parsers (`regex`, `dateutil`, strict structural rules). If the pattern is known, it parses instantly with 0% hallucination risk.
2. **L2 - Semantic Routing:** Maps obfuscated headers to strict Pydantic schemas using embedding-based alignment.
3. **L3 - LLM Fallback:** Only triggered for high-entropy "free-text" noise.

The agent receives a perfectly structured, flattened JSON array ready for reasoning.

---

## 🚀 Quick Start (Claude Desktop)

To use ETL-D with Claude Desktop, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "etld": {
      "command": "npx",
      "args": [
        "-y",
        "@pablixnieto2/etld-mcp-server@3.2.2"
      ],
      "env": {
        "ETLD_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Authentication & API Key
ETL-D uses a hybrid compute engine (Python backend) to run the deterministic parsing layers. To prevent abuse, it requires an API Key. 

You can provision an API key by getting Prepaid Credits or a Monthly Subscription here:
👉 **[Get ETL-D API Key](https://api.etl-d.net)** *(Requires Stripe/Unkey auth)*

---

## 🛠️ Available MCP Tools

When connected, your agent will automatically have access to the following deterministic pipelines:

### 1. B2B & Financial Parsing
* **`parse_bank_statement`**: Transforms Spanish **Norma 43 (N43)** raw files into structured JSON (account info, balances, multi-line transactions).
* **`parse_edi`**: Parses raw ANSI X12 EDI strings (optimized for 850 POs) into structured JSON.
* **`parse_trade_history`**: Deterministic extraction of complex broker trade exports.
* **`generate_sepa_xml`**: Converts JSON into SEPA Direct Debit (PAIN.008.001.02) XML files.

### 2. Document Intelligence
* **`pdf_to_spatial_markdown`**: Converts raw PDFs into LLM-optimized Markdown, preserving table structures and spatial context before the LLM attempts to read it.
* **`extract_invoice` / `extract_resume`**: Strict schema extraction for standard business documents.

### 3. Core Enrichment (Atomic Tools)
* **`enrich_amount`**: Extracts precise financial data (float values, ISO currency codes) from messy strings (e.g., "Total: 1.240,50€").
* **`enrich_date`**: Resolves human-readable dates (e.g., "next Tuesday at 5pm") with timezone awareness into ISO 8601.
* **`enrich_address`**: Transforms messy global address strings into standardized components.
* **`accounting_map`**: Omnidirectional mapper that translates unstructured expense concepts into standard accounting frameworks (e.g., US GAAP, ES PGC).

---

---

## 🏗️ Architecture & Ecosystem

This repository (`etld-mcp-server`) contains the lightweight TypeScript/Node.js MCP Server. It acts as a stateless bridge between your AI Agent (like Claude Desktop) and the ETL-D Cloud Engine.

**The ETL-D Ecosystem:**
1. **MCP Server (This repo):** The native integration for Claude and other MCP-compatible agents.
2. **Cloud API:** The heavy lifting (Python/FastAPI engine) runs securely on `api.etl-d.net`.
3. **Python SDK:** Building your own custom agent in Python? You don't need MCP. Just use our native Python SDK: `pip install etld`.

## License
MIT
