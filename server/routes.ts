import {
  createServer,
  type Server,
} from 'node:http';

import type { Express } from 'express';
import { marked } from 'marked';

import {
  type ChatSession,
  GoogleGenerativeAI,
} from '@google/generative-ai';

import { birdeyeRoutes } from './birdeye';
import { setupEnvironment } from './env';

interface BirdeyeToken {
  symbol: string;
  name: string;
  address: string;
  market_cap?: number;
  price?: number;
  volume_24h_usd?: number;
  logo_uri?: string;
  verified?: boolean;
}

const env = setupEnvironment();
const PORT = env.PORT || 3003;
const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.9,
    topP: 1,
    topK: 1,
    maxOutputTokens: 2048,
  },
});

// Store chat sessions in memory
const chatSessions = new Map<string, ChatSession>();

// Format raw text into proper markdown
async function formatResponseToMarkdown(
  text: string | Promise<string>
): Promise<string> {
  // Ensure we have a string to work with
  const resolvedText = await Promise.resolve(text);

  // First, ensure consistent newlines
  let processedText = resolvedText.replace(/\r\n/g, "\n");

  // Process main sections (lines that start with word(s) followed by colon)
  processedText = processedText.replace(
    /^([A-Za-z][A-Za-z\s]+):(\s*)/gm,
    "## $1$2"
  );

  // Process sub-sections (any remaining word(s) followed by colon within text)
  processedText = processedText.replace(
    /(?<=\n|^)([A-Za-z][A-Za-z\s]+):(?!\d)/gm,
    "### $1"
  );

  // Process bullet points
  processedText = processedText.replace(/^[•●○]\s*/gm, "* ");

  // Split into paragraphs
  const paragraphs = processedText.split("\n\n").filter(Boolean);

  // Process each paragraph
  const formatted = paragraphs
    .map((p) => {
      // If it's a header or list item, preserve it
      if (p.startsWith("#") || p.startsWith("*") || p.startsWith("-")) {
        return p;
      }
      // Add proper paragraph formatting
      return `${p}\n`;
    })
    .join("\n\n");

  // Configure marked options for better header rendering
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  // Convert markdown to HTML using marked
  return marked.parse(formatted);
}

interface WebSource {
  uri: string;
  title: string;
}

interface GroundingChunk {
  web?: WebSource;
}

interface TextSegment {
  startIndex: number;
  endIndex: number;
  text: string;
}

interface GroundingSupport {
  segment: TextSegment;
  groundingChunkIndices: number[];
  confidenceScores: number[];
}

interface SearchEntryPoint {
  type: string;
  params?: Record<string, unknown>;
}

interface GroundingMetadata {
  groundingChunks: GroundingChunk[];
  groundingSupports: GroundingSupport[];
  searchEntryPoint?: SearchEntryPoint;
  webSearchQueries?: string[];
}

export function registerRoutes(app: Express): Server {
  // Register Birdeye API routes
  app.use('/api/birdeye', birdeyeRoutes);

  // Solana blockchain search endpoint
  app.get("/api/solana/search", async (req, res) => {
    try {
      const query = req.query.q as string;

      if (!query) {
        return res.status(400).json({
          message: "Query parameter 'q' is required",
        });
      }

      // Try to search using our Solana search functionality
      const response = await fetch('http://localhost:3003/api/solana/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: query })
      });

      if (response.ok) {
        const solanaData = await response.json();
        if (solanaData) {
          return res.json({
            summary: `
              **Solana Account Details**
              
              ${solanaData.type ? `**Type**: ${solanaData.type}` : ''}
              ${solanaData.balance ? `**Balance**: ${solanaData.balance} SOL` : ''}
              ${solanaData.owner ? `**Owner**: ${solanaData.owner}` : ''}
              ${solanaData.collection ? `**Collection**: ${solanaData.collection}` : ''}
              ${solanaData.name ? `**Name**: ${solanaData.name}` : ''}
            `.trim(),
            sources: [{
              title: solanaData.type || 'Solana Account',
              url: `https://xray.helius.xyz/account/${query}`,
              snippet: `Address: ${query}`
            }]
          });
        }
      }

      // If not found as an address, try Birdeye token search
      const tokenResponse = await fetch(`http://localhost:${env.PORT || 3003}/api/birdeye/token/search?q=${encodeURIComponent(query)}`);
      
      if (tokenResponse.ok) {
        const tokens = await tokenResponse.json();
        
        if (tokens && tokens.length > 0) {
          const topTokens = tokens.slice(0, 5); // Take top 5 results
          const summary = `
            **Found ${topTokens.length} tokens matching "${query}"**
            
            ${topTokens.map((token: BirdeyeToken) => `
            **${token.symbol || 'Unknown Token'}**
            * Name: ${token.name || 'N/A'} 
            * Address: ${token.address}
            * Market Cap: $${token.market_cap ? Number(token.market_cap).toLocaleString() : 'N/A'}
            * Price: $${token.price ? Number(token.price).toLocaleString() : 'N/A'}
            * 24h Volume: $${token.volume_24h_usd ? Number(token.volume_24h_usd).toLocaleString() : 'N/A'}
            `).join('\n')}
          `;

          return res.json({
            summary: summary.trim(),
            sources: topTokens.map((token: BirdeyeToken) => ({
              title: token.symbol || 'Unknown Token',
              url: `https://birdeye.so/token/${token.address}?chain=solana`,
              snippet: `${token.name || 'Unknown'} - Price: $${token.price ? Number(token.price).toLocaleString() : 'N/A'} - 24h Volume: $${token.volume_24h_usd ? Number(token.volume_24h_usd).toLocaleString() : 'N/A'}`
            }))
          });
        }
      }

      // If no results found from either search
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

  // Solana address lookup endpoint
  app.post("/api/solana/address", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ message: "Address is required" });
      }

      const HELIUS_API_KEY = env.HELIUS_API_KEY;
      const response = await fetch(`https://api.helius.xyz/v0/addresses/?api-key=${HELIUS_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addresses: [address]
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch address data from Helius');
      }

      const data = await response.json();
      // Return the first address data since we only requested one
      res.json(data[0] || {});
    } catch (error) {
      console.error("Helius API error:", error);
      res.status(500).json({ message: "Failed to fetch address data" });
    }
  });

  // Search endpoint - creates a new chat session
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;

      if (!query) {
        return res.status(400).json({
          message: "Query parameter 'q' is required",
        });
      }

      // Create a new chat session with search capability
      const chat = model.startChat({
        tools: [
          {
            // @ts-ignore - google_search is a valid tool but not typed in the SDK yet
            google_search: {},
          },
        ],
      });

      // Generate content with search tool
      const result = await chat.sendMessage(query);
      const response = await result.response;
      console.log(
        "Raw Google API Response:",
        JSON.stringify(
          {
            text: response.text(),
            candidates: response.candidates,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata,
          },
          null,
          2
        )
      );
      const text = response.text();

      // Format the response text to proper markdown/HTML
      const formattedText = await formatResponseToMarkdown(text);

      // Extract sources from grounding metadata
      const sourceMap = new Map<
        string,
        { title: string; url: string; snippet: string }
      >();

      // Get grounding metadata from response
      const metadata = response.candidates?.[0]?.groundingMetadata as GroundingMetadata;
      if (metadata) {
        const chunks = metadata.groundingChunks || [];
        const supports = metadata.groundingSupports || [];

        chunks.forEach((chunk: GroundingChunk, index: number) => {
          if (chunk.web?.uri && chunk.web?.title) {
            const url = chunk.web.uri;
            if (!sourceMap.has(url)) {
              // Find snippets that reference this chunk
              const snippets = supports
                .filter((support: GroundingSupport) =>
                  support.groundingChunkIndices.includes(index)
                )
                .map((support: GroundingSupport) => support.segment.text)
                .join(" ");

              sourceMap.set(url, {
                title: chunk.web.title,
                url: url,
                snippet: snippets || "",
              });
            }
          }
        });
      }

      const sources = Array.from(sourceMap.values());

      // Generate a session ID and store the chat
      const sessionId = Math.random().toString(36).substring(7);
      chatSessions.set(sessionId, chat);

      res.json({
        sessionId,
        summary: formattedText,
        sources,
      });
    } catch (error) {
      console.error("Search error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred while processing your search";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Follow-up endpoint - continues existing chat session
  app.post("/api/follow-up", async (req, res) => {
    try {
      const { sessionId, query } = req.body;

      if (!sessionId || !query) {
        return res.status(400).json({
          message: "Both sessionId and query are required",
        });
      }

      const chat = chatSessions.get(sessionId);
      if (!chat) {
        return res.status(404).json({
          message: "Chat session not found",
        });
      }

      // Send follow-up message in existing chat
      const result = await chat.sendMessage(query);
      const response = await result.response;
      console.log(
        "Raw Google API Follow-up Response:",
        JSON.stringify(
          {
            text: response.text(),
            candidates: response.candidates,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata,
          },
          null,
          2
        )
      );
      const text = response.text();

      // Format the response text to proper markdown/HTML
      const formattedText = await formatResponseToMarkdown(text);

      // Extract sources from grounding metadata
      const sourceMap = new Map<
        string,
        { title: string; url: string; snippet: string }
      >();

      // Get grounding metadata from response
      const metadata = response.candidates?.[0]?.groundingMetadata as GroundingMetadata;
      if (metadata) {
        const chunks = metadata.groundingChunks || [];
        const supports = metadata.groundingSupports || [];

        chunks.forEach((chunk: GroundingChunk, index: number) => {
          if (chunk.web?.uri && chunk.web?.title) {
            const url = chunk.web.uri;
            if (!sourceMap.has(url)) {
              // Find snippets that reference this chunk
              const snippets = supports
                .filter((support: GroundingSupport) =>
                  support.groundingChunkIndices.includes(index)
                )
                .map((support: GroundingSupport) => support.segment.text)
                .join(" ");

              sourceMap.set(url, {
                title: chunk.web.title,
                url: url,
                snippet: snippets || "",
              });
            }
          }
        });
      }

      const sources = Array.from(sourceMap.values());

      res.json({
        summary: formattedText,
        sources,
      });
    } catch (error) {
      console.error("Follow-up error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred while processing your follow-up question";
      res.status(500).json({ message: errorMessage });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
