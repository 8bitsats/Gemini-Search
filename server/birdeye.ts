import axios from 'axios';
import { Router } from 'express';
import { EnrichedTransaction } from 'helius-sdk';

import { setupEnvironment } from './env';
import { parseTransaction } from './xray';

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

interface BirdeyeTokenOverview {
  items: EnrichedTransaction[];
  [key: string]: any;
}

interface BirdeyeTransactionResponse {
  items: EnrichedTransaction[];
  [key: string]: any;
}

interface BirdeyeSearchResponse {
  data: {
    items: Array<{
      result: unknown[];
    }>;
  };
}

type TokenRecord = {
  [K in keyof BirdeyeToken]: unknown;
};

const router = Router();
const env = setupEnvironment();
const CHESH_TOKEN = 'FwVFweNUdUbfJUKAzreyTYVQoeW6LyqaPcLcn3tzY1ZS';

// Token search endpoint
router.get('/token/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const data = await birdeyeRequest<BirdeyeSearchResponse>('/defi/v3/search', {
      chain: 'solana',
      target: 'token',
      search: query,
      sort_by: 'volume_24h_usd',
      sort_type: 'desc',
      offset: 0,
      limit: 20
    });

    if (!data?.data?.items?.[0]?.result) {
      return res.json([]);
    }

    // Extract and validate token results
    const tokens = data.data.items[0].result.filter((token): token is BirdeyeToken => {
      const record = token as TokenRecord;
      return (
        record &&
        typeof record === 'object' &&
        typeof record.address === 'string' &&
        typeof record.symbol === 'string' &&
        typeof record.name === 'string'
      );
    }
    );
    
    res.json(tokens);
  } catch (error) {
    console.error('Token search error:', error);
    res.status(500).json({ error: 'Failed to search tokens' });
  }
});

// Helper function to make Birdeye API calls
async function birdeyeRequest<T>(endpoint: string, params = {}): Promise<T> {
  try {
    const response = await axios.get(`https://public-api.birdeye.so${endpoint}`, {
      headers: {
        'X-API-KEY': env.BIRDEYE_API_KEY,
        'x-chain': 'solana',
      },
      params,
      timeout: 10000, // 10 second timeout
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Birdeye API error:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      if (error.response?.status === 401) {
        throw new Error('Invalid Birdeye API key');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded');
      }
    }
    throw error;
  }
}

// Get token overview
router.get('/token/overview', async (req, res) => {
  try {
    const data = await birdeyeRequest<BirdeyeTokenOverview>('/defi/token_overview', {
      address: CHESH_TOKEN,
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
    res.status(500).json({ error: 'Failed to fetch token overview' });
  }
});

// Get token metadata
router.get('/token/metadata', async (req, res) => {
  try {
    const data = await birdeyeRequest('/defi/v3/token/meta-data/single', {
      address: CHESH_TOKEN,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch token metadata' });
  }
});

// Get token market data
router.get('/token/market', async (req, res) => {
  try {
    const data = await birdeyeRequest('/defi/v3/token/market-data', {
      address: CHESH_TOKEN,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Get wallet token balance
router.get('/wallet/balance/:wallet', async (req, res) => {
  try {
    const data = await birdeyeRequest('/v1/wallet/token_balance', {
      wallet: req.params.wallet,
      token_address: CHESH_TOKEN,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
});

// Get transaction history
router.get('/wallet/transactions/:wallet', async (req, res) => {
  try {
    const data = await birdeyeRequest<BirdeyeTransactionResponse>('/v1/wallet/tx_list', {
      wallet: req.params.wallet,
      limit: 100,
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
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

export const birdeyeRoutes = router;
