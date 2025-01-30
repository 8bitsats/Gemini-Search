import type { EnrichedTransaction } from 'helius-sdk';
import { Source } from 'helius-sdk';

import {
  ProtonTransaction,
  ProtonTransactionAction,
  ProtonType,
  unknownProtonTransaction,
} from './types';

// Helper to create a basic transaction structure
const createBaseTransaction = (
  transaction: EnrichedTransaction,
  type: ProtonType,
  address?: string
): ProtonTransaction => {
  return {
    type,
    primaryUser: address || '',
    fee: transaction.fee || 0,
    signature: transaction.signature,
    timestamp: transaction.timestamp || 0,
    source: transaction.source || Source.SYSTEM_PROGRAM,
    actions: [],
    accounts: [],
    raw: transaction,
  };
};

// Parse transfer transactions
export const parseTransfer = (
  transaction: EnrichedTransaction,
  address?: string
): ProtonTransaction => {
  const result = createBaseTransaction(transaction, 'TRANSFER', address);
  
  if (!transaction.tokenTransfers?.length) {
    return result;
  }

  transaction.tokenTransfers.forEach((transfer) => {
    const action: ProtonTransactionAction = {
      actionType: transfer.fromUserAccount === address ? 'SENT' : 'RECEIVED',
      from: transfer.fromUserAccount || 'unknown',
      to: transfer.toUserAccount || 'unknown',
      amount: transfer.tokenAmount,
    };
    result.actions.push(action);
  });

  return result;
};

// Parse swap transactions
export const parseSwap = (
  transaction: EnrichedTransaction,
  address?: string
): ProtonTransaction => {
  const result = createBaseTransaction(transaction, 'SWAP', address);

  if (!transaction.tokenTransfers?.length) {
    return result;
  }

  // Group transfers into sent and received
  const sent = transaction.tokenTransfers.find(
    (t) => t.fromUserAccount === address
  );
  const received = transaction.tokenTransfers.find(
    (t) => t.toUserAccount === address
  );

  if (sent && received) {
    const action: ProtonTransactionAction = {
      actionType: 'SWAP',
      from: sent.fromUserAccount || 'unknown',
      to: received.toUserAccount || 'unknown',
      sent: sent.mint,
      received: received.mint,
      amount: sent.tokenAmount,
    };
    result.actions.push(action);
  }

  return result;
};

// Parse NFT transactions
export const parseNftSale = (
  transaction: EnrichedTransaction,
  address?: string
): ProtonTransaction => {
  const result = createBaseTransaction(transaction, 'NFT_SALE', address);

  if (!transaction.nativeTransfers?.length) {
    return result;
  }

  transaction.nativeTransfers.forEach((transfer) => {
    const action: ProtonTransactionAction = {
      actionType: 'NFT_SALE',
      from: transfer.fromUserAccount || 'unknown',
      to: transfer.toUserAccount || 'unknown',
      amount: transfer.amount,
    };
    result.actions.push(action);
  });

  return result;
};

// Parse unknown transactions
export const parseUnknown = (
  transaction: EnrichedTransaction,
  address?: string
): ProtonTransaction => {
  return {
    ...unknownProtonTransaction,
    signature: transaction.signature,
    timestamp: transaction.timestamp || 0,
    primaryUser: address || '',
    raw: transaction,
  };
};

// Main parser function
export const parseTransaction = (
  transaction: EnrichedTransaction,
  address?: string
): ProtonTransaction => {
  try {
    switch (transaction.type) {
      case 'TRANSFER':
        return parseTransfer(transaction, address);
      case 'SWAP':
        return parseSwap(transaction, address);
      case 'NFT_SALE':
        return parseNftSale(transaction, address);
      default:
        return parseUnknown(transaction, address);
    }
  } catch (error) {
    console.error('Error parsing transaction:', error);
    return parseUnknown(transaction, address);
  }
};
