// server/index.ts
import express2 from "express";
import path4 from "path";
import { fileURLToPath as fileURLToPath4 } from "url";

// server/env.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var envPath = path.resolve(__dirname, "../.env");
function setupEnvironment() {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    throw new Error(
      `Failed to load .env file from ${envPath}: ${result.error.message}`
    );
  }
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error(
      "GOOGLE_API_KEY environment variable must be set in .env file"
    );
  }
  if (!process.env.BIRDEYE_API_KEY) {
    throw new Error(
      "BIRDEYE_API_KEY environment variable must be set in .env file"
    );
  }
  if (!process.env.HELIUS_API_KEY) {
    throw new Error(
      "HELIUS_API_KEY environment variable must be set in .env file"
    );
  }
  return {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY,
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3003
  };
}

// server/routes.ts
import {
  createServer
} from "node:http";
import { marked } from "marked";
import {
  GoogleGenerativeAI
} from "@google/generative-ai";

// server/birdeye.ts
import axios from "axios";
import { Router } from "express";

// server/xray/types.ts
import {
  Source
} from "helius-sdk";
var unknownProtonTransaction = {
  accounts: [],
  actions: [],
  fee: 0,
  primaryUser: "",
  signature: "",
  source: Source.SYSTEM_PROGRAM,
  timestamp: 0,
  type: "UNKNOWN"
};

// server/xray/parser.ts
import { Source as Source2 } from "helius-sdk";
var createBaseTransaction = (transaction, type, address) => {
  return {
    type,
    primaryUser: address || "",
    fee: transaction.fee || 0,
    signature: transaction.signature,
    timestamp: transaction.timestamp || 0,
    source: transaction.source || Source2.SYSTEM_PROGRAM,
    actions: [],
    accounts: [],
    raw: transaction
  };
};
var parseTransfer = (transaction, address) => {
  const result = createBaseTransaction(transaction, "TRANSFER", address);
  if (!transaction.tokenTransfers?.length) {
    return result;
  }
  transaction.tokenTransfers.forEach((transfer) => {
    const action = {
      actionType: transfer.fromUserAccount === address ? "SENT" : "RECEIVED",
      from: transfer.fromUserAccount || "unknown",
      to: transfer.toUserAccount || "unknown",
      amount: transfer.tokenAmount
    };
    result.actions.push(action);
  });
  return result;
};
var parseSwap = (transaction, address) => {
  const result = createBaseTransaction(transaction, "SWAP", address);
  if (!transaction.tokenTransfers?.length) {
    return result;
  }
  const sent = transaction.tokenTransfers.find(
    (t) => t.fromUserAccount === address
  );
  const received = transaction.tokenTransfers.find(
    (t) => t.toUserAccount === address
  );
  if (sent && received) {
    const action = {
      actionType: "SWAP",
      from: sent.fromUserAccount || "unknown",
      to: received.toUserAccount || "unknown",
      sent: sent.mint,
      received: received.mint,
      amount: sent.tokenAmount
    };
    result.actions.push(action);
  }
  return result;
};
var parseNftSale = (transaction, address) => {
  const result = createBaseTransaction(transaction, "NFT_SALE", address);
  if (!transaction.nativeTransfers?.length) {
    return result;
  }
  transaction.nativeTransfers.forEach((transfer) => {
    const action = {
      actionType: "NFT_SALE",
      from: transfer.fromUserAccount || "unknown",
      to: transfer.toUserAccount || "unknown",
      amount: transfer.amount
    };
    result.actions.push(action);
  });
  return result;
};
var parseUnknown = (transaction, address) => {
  return {
    ...unknownProtonTransaction,
    signature: transaction.signature,
    timestamp: transaction.timestamp || 0,
    primaryUser: address || "",
    raw: transaction
  };
};
var parseTransaction = (transaction, address) => {
  try {
    switch (transaction.type) {
      case "TRANSFER":
        return parseTransfer(transaction, address);
      case "SWAP":
        return parseSwap(transaction, address);
      case "NFT_SALE":
        return parseNftSale(transaction, address);
      default:
        return parseUnknown(transaction, address);
    }
  } catch (error) {
    console.error("Error parsing transaction:", error);
    return parseUnknown(transaction, address);
  }
};

// server/birdeye.ts
var router = Router();
var env = setupEnvironment();
var CHESH_TOKEN = "FwVFweNUdUbfJUKAzreyTYVQoeW6LyqaPcLcn3tzY1ZS";
router.get("/token/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }
    const data = await birdeyeRequest("/defi/v3/search", {
      chain: "solana",
      target: "token",
      search: query,
      sort_by: "volume_24h_usd",
      sort_type: "desc",
      offset: 0,
      limit: 20
    });
    if (!data?.data?.items?.[0]?.result) {
      return res.json([]);
    }
    const tokens = data.data.items[0].result.filter(
      (token) => {
        const record = token;
        return record && typeof record === "object" && typeof record.address === "string" && typeof record.symbol === "string" && typeof record.name === "string";
      }
    );
    res.json(tokens);
  } catch (error) {
    console.error("Token search error:", error);
    res.status(500).json({ error: "Failed to search tokens" });
  }
});
async function birdeyeRequest(endpoint, params = {}) {
  try {
    const response = await axios.get(`https://public-api.birdeye.so${endpoint}`, {
      headers: {
        "X-API-KEY": env.BIRDEYE_API_KEY,
        "x-chain": "solana"
      },
      params,
      timeout: 1e4
      // 10 second timeout
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Birdeye API error:", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      if (error.response?.status === 401) {
        throw new Error("Invalid Birdeye API key");
      }
      if (error.response?.status === 429) {
        throw new Error("Rate limit exceeded");
      }
    }
    throw error;
  }
}
router.get("/token/overview", async (req, res) => {
  try {
    const data = await birdeyeRequest("/defi/token_overview", {
      address: CHESH_TOKEN
    });
    if (!data.items) {
      return res.json(data);
    }
    const parsedTransactions = data.items.map((tx) => ({
      raw: tx,
      parsed: parseTransaction(tx)
    }));
    res.json({
      ...data,
      items: parsedTransactions
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch token overview" });
  }
});
router.get("/token/metadata", async (req, res) => {
  try {
    const data = await birdeyeRequest("/defi/v3/token/meta-data/single", {
      address: CHESH_TOKEN
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch token metadata" });
  }
});
router.get("/token/market", async (req, res) => {
  try {
    const data = await birdeyeRequest("/defi/v3/token/market-data", {
      address: CHESH_TOKEN
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});
router.get("/wallet/balance/:wallet", async (req, res) => {
  try {
    const data = await birdeyeRequest("/v1/wallet/token_balance", {
      wallet: req.params.wallet,
      token_address: CHESH_TOKEN
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch wallet balance" });
  }
});
router.get("/wallet/transactions/:wallet", async (req, res) => {
  try {
    const data = await birdeyeRequest("/v1/wallet/tx_list", {
      wallet: req.params.wallet,
      limit: 100
    });
    if (!data.items) {
      return res.json(data);
    }
    const parsedTransactions = data.items.map((tx) => ({
      raw: tx,
      parsed: parseTransaction(tx, req.params.wallet)
    }));
    res.json({
      ...data,
      items: parsedTransactions
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transaction history" });
  }
});
var birdeyeRoutes = router;

// server/routes.ts
var env2 = setupEnvironment();
var PORT = env2.PORT || 3003;
var genAI = new GoogleGenerativeAI(env2.GOOGLE_API_KEY);
var model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.9,
    topP: 1,
    topK: 1,
    maxOutputTokens: 2048
  }
});
var chatSessions = /* @__PURE__ */ new Map();
async function formatResponseToMarkdown(text) {
  const resolvedText = await Promise.resolve(text);
  let processedText = resolvedText.replace(/\r\n/g, "\n");
  processedText = processedText.replace(
    /^([A-Za-z][A-Za-z\s]+):(\s*)/gm,
    "## $1$2"
  );
  processedText = processedText.replace(
    /(?<=\n|^)([A-Za-z][A-Za-z\s]+):(?!\d)/gm,
    "### $1"
  );
  processedText = processedText.replace(/^[•●○]\s*/gm, "* ");
  const paragraphs = processedText.split("\n\n").filter(Boolean);
  const formatted = paragraphs.map((p) => {
    if (p.startsWith("#") || p.startsWith("*") || p.startsWith("-")) {
      return p;
    }
    return `${p}
`;
  }).join("\n\n");
  marked.setOptions({
    gfm: true,
    breaks: true
  });
  return marked.parse(formatted);
}
function registerRoutes(app2) {
  app2.use("/api/birdeye", birdeyeRoutes);
  app2.get("/api/solana/search", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({
          message: "Query parameter 'q' is required"
        });
      }
      const response = await fetch("http://localhost:3003/api/solana/address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ address: query })
      });
      if (response.ok) {
        const solanaData = await response.json();
        if (solanaData) {
          return res.json({
            summary: `
              **Solana Account Details**
              
              ${solanaData.type ? `**Type**: ${solanaData.type}` : ""}
              ${solanaData.balance ? `**Balance**: ${solanaData.balance} SOL` : ""}
              ${solanaData.owner ? `**Owner**: ${solanaData.owner}` : ""}
              ${solanaData.collection ? `**Collection**: ${solanaData.collection}` : ""}
              ${solanaData.name ? `**Name**: ${solanaData.name}` : ""}
            `.trim(),
            sources: [{
              title: solanaData.type || "Solana Account",
              url: `https://xray.helius.xyz/account/${query}`,
              snippet: `Address: ${query}`
            }]
          });
        }
      }
      const tokenResponse = await fetch(`http://localhost:${env2.PORT || 3003}/api/birdeye/token/search?q=${encodeURIComponent(query)}`);
      if (tokenResponse.ok) {
        const tokens = await tokenResponse.json();
        if (tokens && tokens.length > 0) {
          const topTokens = tokens.slice(0, 5);
          const summary = `
            **Found ${topTokens.length} tokens matching "${query}"**
            
            ${topTokens.map((token) => `
            **${token.symbol || "Unknown Token"}**
            * Name: ${token.name || "N/A"} 
            * Address: ${token.address}
            * Market Cap: $${token.market_cap ? Number(token.market_cap).toLocaleString() : "N/A"}
            * Price: $${token.price ? Number(token.price).toLocaleString() : "N/A"}
            * 24h Volume: $${token.volume_24h_usd ? Number(token.volume_24h_usd).toLocaleString() : "N/A"}
            `).join("\n")}
          `;
          return res.json({
            summary: summary.trim(),
            sources: topTokens.map((token) => ({
              title: token.symbol || "Unknown Token",
              url: `https://birdeye.so/token/${token.address}?chain=solana`,
              snippet: `${token.name || "Unknown"} - Price: $${token.price ? Number(token.price).toLocaleString() : "N/A"} - 24h Volume: $${token.volume_24h_usd ? Number(token.volume_24h_usd).toLocaleString() : "N/A"}`
            }))
          });
        }
      }
      return res.json({
        summary: `No results found for "${query}" on the Solana blockchain.`,
        sources: []
      });
    } catch (error) {
      console.error("Solana search error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred while searching the Solana blockchain";
      res.status(500).json({ message: errorMessage });
    }
  });
  app2.post("/api/solana/address", async (req, res) => {
    try {
      const { address } = req.body;
      if (!address) {
        return res.status(400).json({ message: "Address is required" });
      }
      const HELIUS_API_KEY = env2.HELIUS_API_KEY;
      const response = await fetch(`https://api.helius.xyz/v0/addresses/?api-key=${HELIUS_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          addresses: [address]
        })
      });
      if (!response.ok) {
        throw new Error("Failed to fetch address data from Helius");
      }
      const data = await response.json();
      res.json(data[0] || {});
    } catch (error) {
      console.error("Helius API error:", error);
      res.status(500).json({ message: "Failed to fetch address data" });
    }
  });
  app2.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({
          message: "Query parameter 'q' is required"
        });
      }
      const chat = model.startChat({
        tools: [
          {
            // @ts-ignore - google_search is a valid tool but not typed in the SDK yet
            google_search: {}
          }
        ]
      });
      const result = await chat.sendMessage(query);
      const response = await result.response;
      console.log(
        "Raw Google API Response:",
        JSON.stringify(
          {
            text: response.text(),
            candidates: response.candidates,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata
          },
          null,
          2
        )
      );
      const text = response.text();
      const formattedText = await formatResponseToMarkdown(text);
      const sourceMap = /* @__PURE__ */ new Map();
      const metadata = response.candidates?.[0]?.groundingMetadata;
      if (metadata) {
        const chunks = metadata.groundingChunks || [];
        const supports = metadata.groundingSupports || [];
        chunks.forEach((chunk, index) => {
          if (chunk.web?.uri && chunk.web?.title) {
            const url = chunk.web.uri;
            if (!sourceMap.has(url)) {
              const snippets = supports.filter(
                (support) => support.groundingChunkIndices.includes(index)
              ).map((support) => support.segment.text).join(" ");
              sourceMap.set(url, {
                title: chunk.web.title,
                url,
                snippet: snippets || ""
              });
            }
          }
        });
      }
      const sources = Array.from(sourceMap.values());
      const sessionId = Math.random().toString(36).substring(7);
      chatSessions.set(sessionId, chat);
      res.json({
        sessionId,
        summary: formattedText,
        sources
      });
    } catch (error) {
      console.error("Search error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred while processing your search";
      res.status(500).json({ message: errorMessage });
    }
  });
  app2.post("/api/follow-up", async (req, res) => {
    try {
      const { sessionId, query } = req.body;
      if (!sessionId || !query) {
        return res.status(400).json({
          message: "Both sessionId and query are required"
        });
      }
      const chat = chatSessions.get(sessionId);
      if (!chat) {
        return res.status(404).json({
          message: "Chat session not found"
        });
      }
      const result = await chat.sendMessage(query);
      const response = await result.response;
      console.log(
        "Raw Google API Follow-up Response:",
        JSON.stringify(
          {
            text: response.text(),
            candidates: response.candidates,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata
          },
          null,
          2
        )
      );
      const text = response.text();
      const formattedText = await formatResponseToMarkdown(text);
      const sourceMap = /* @__PURE__ */ new Map();
      const metadata = response.candidates?.[0]?.groundingMetadata;
      if (metadata) {
        const chunks = metadata.groundingChunks || [];
        const supports = metadata.groundingSupports || [];
        chunks.forEach((chunk, index) => {
          if (chunk.web?.uri && chunk.web?.title) {
            const url = chunk.web.uri;
            if (!sourceMap.has(url)) {
              const snippets = supports.filter(
                (support) => support.groundingChunkIndices.includes(index)
              ).map((support) => support.segment.text).join(" ");
              sourceMap.set(url, {
                title: chunk.web.title,
                url,
                snippet: snippets || ""
              });
            }
          }
        });
      }
      const sources = Array.from(sourceMap.values());
      res.json({
        summary: formattedText,
        sources
      });
    } catch (error) {
      console.error("Follow-up error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred while processing your follow-up question";
      res.status(500).json({ message: errorMessage });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path3, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
import {
  createLogger,
  createServer as createViteServer
} from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path2, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname(__filename2);
var vite_config_default = defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@db": path2.resolve(__dirname2, "db"),
      "@": path2.resolve(__dirname2, "client", "src")
    }
  },
  root: path2.resolve(__dirname2, "client"),
  build: {
    outDir: path2.resolve(__dirname2, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = dirname2(__filename3);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        if (msg.includes("[TypeScript] Found 0 errors. Watching for file changes")) {
          log("no errors found", "tsc");
          return;
        }
        if (msg.includes("[TypeScript] ")) {
          const [errors, summary] = msg.split("[TypeScript] ", 2);
          log(`${summary} ${errors}\x1B[0m`, "tsc");
          return;
        } else {
          viteLogger.error(msg, options);
          process.exit(1);
        }
      }
    },
    server: {
      middlewareMode: true,
      hmr: { server }
    },
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname3,
        "..",
        "client",
        "index.html"
      );
      const template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname3, "..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var env3 = setupEnvironment();
console.log("\n--- Environment Setup Debug ---");
console.log("Environment variables loaded:", env3);
console.log("--- End Debug ---\n");
var __filename4 = fileURLToPath4(import.meta.url);
var __dirname4 = path4.dirname(__filename4);
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const PORT2 = 3003;
  server.listen(PORT2, "0.0.0.0", () => {
    log(`serving on port ${PORT2}`);
  });
})();
