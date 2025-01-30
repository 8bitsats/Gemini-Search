import {
  Connection,
  PublicKey,
} from '@solana/web3.js';

const HELIUS_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=6b52d42b-5d24-4841-a093-02b0d2cc9fc0';
const HELIUS_API_KEY = '6b52d42b-5d24-4841-a093-02b0d2cc9fc0';
const HELIUS_API_URL = 'https://api.helius.xyz/v0';

const connection = new Connection(HELIUS_RPC_URL);

interface HeliusAddressLookup {
  address: string;
  type?: string;
  owner?: string;
  balance?: number;
  collection?: string;
  name?: string;
}

interface HeliusTransactionInfo {
  type?: string;
  description?: string;
  source?: string;
  fee?: number;
  timestamp?: number;
  status?: 'success' | 'failed';
}

async function fetchHeliusData<T>(endpoint: string, params: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${HELIUS_API_URL}${endpoint}?api-key=${HELIUS_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  return response.json();
}

export interface SolanaSearchResult {
  type: 'account' | 'transaction' | 'token' | 'nft' | 'domain';
  title: string;
  address: string;
  details: {
    balance?: number | null;
    executable?: boolean;
    owner?: string;
    blockTime?: string | null;
    fee?: number;
    status?: string;
    description?: string;
    type?: string;
    source?: string;
    collection?: string;
    name?: string;
    [key: string]: unknown;
  };
}

export async function searchSolana(query: string): Promise<SolanaSearchResult[]> {
  const results: SolanaSearchResult[] = [];
  
  // Check if query is a valid public key
  try {
    const pubkey = new PublicKey(query);
      const [accountInfo, enrichedData] = await Promise.all([
        connection.getAccountInfo(pubkey),
        fetchHeliusData<HeliusAddressLookup[]>('/addresses', {
          addresses: [pubkey.toString()]
        })
    ]);
    
    if (accountInfo || enrichedData?.[0]) {
      const enriched = enrichedData?.[0] || {};
      results.push({
        type: 'account',
        title: enriched.type || 'Solana Account',
        address: pubkey.toString(),
        details: {
          balance: accountInfo?.lamports ? accountInfo.lamports / 1e9 : null,
          executable: accountInfo?.executable || false,
          owner: accountInfo?.owner.toString(),
          ...enriched
        }
      });
    }
  } catch (error) {
    console.error('Error searching account:', error);
  }

  // Check if query is a .sol domain
  if (query.endsWith('.sol')) {
    try {
      const domainKey = await getDomainKey(query);
      results.push({
        type: 'domain',
        title: query,
        address: domainKey.toString(),
        details: {
          type: 'SNS Domain'
        }
      });
    } catch {}
  }

  // Check if query is a transaction signature
  if (query.length === 88 || query.length === 87) {
    try {
      const [tx, enrichedTx] = await Promise.all([
        connection.getTransaction(query),
        fetchHeliusData<HeliusTransactionInfo[]>('/transactions', {
          transactions: [query]
        })
      ]);

      if (tx || enrichedTx?.[0]) {
        const enriched = enrichedTx?.[0] || {};
        results.push({
          type: 'transaction',
          title: enriched.type || 'Transaction',
          address: query,
          details: {
            blockTime: tx?.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : null,
            fee: tx?.meta?.fee,
            status: tx?.meta?.err ? 'Failed' : 'Success',
            description: enriched.description,
            type: enriched.type,
            source: enriched.source,
            ...enriched
          }
        });
      }
    } catch (error) {
      console.error('Error searching transaction:', error);
    }
  }

  return results;
}

async function getDomainKey(domain: string): Promise<PublicKey> {
  // This is a simplified implementation
  // In a real app, you'd want to use the proper SNS SDK
  const hashedDomain = await hashDomain(domain);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('sns'), Buffer.from(hashedDomain)],
    new PublicKey('58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx') // SNS Program ID
  )[0];
}

async function hashDomain(domain: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(domain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}
