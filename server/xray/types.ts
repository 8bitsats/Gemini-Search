import type { EnrichedTransaction } from 'helius-sdk';
import {
  Source,
  TransactionType,
} from 'helius-sdk';

export const SOL = "So11111111111111111111111111111111111111112";

export enum ProtonSupportedType {
    BURN,
    NFT_SALE,
    NFT_MINT,
    SWAP,
    TRANSFER,
    UNKNOWN,
    TOKEN_MINT,
    STAKE_SOL,
    STAKE_TOKEN
}

export enum ProtonSupportedActionType {
    "SENT",
    "RECEIVED",
    "TRANSFER",
    "SWAP",
    "UNKNOWN",
    "NFT_SALE",
    "NFT_MINT",
    "BURN",
    "TOKEN_MINT",
    "STAKE_SOL",
    "STAKE_TOKEN"
}

export type ProtonParser = (
    transaction: EnrichedTransaction,
    address?: string
) => ProtonTransaction;

export interface ProtonTransactionAction {
    actionType: ProtonActionType;
    from: string;
    to: string | 'unknown';
    sent?: string;
    received?: string;
    amount: number;
}

export interface ProtonTransaction {
    type: ProtonType | TransactionType | ProtonActionType;
    primaryUser: string;
    fee: number;
    signature: string;
    timestamp: number;
    source: Source;
    actions: ProtonTransactionAction[];
    accounts: ProtonAccount[];
    raw?: EnrichedTransaction;
    metadata?: { [key: string]: any };
}

export interface ProtonAccount {
    account: string;
    changes: ProtonAccountChange[];
}

export interface ProtonAccountChange {
    mint: string;
    amount: number;
}

export type ProtonParsers = Record<string, ProtonParser>;

export const unknownProtonTransaction: ProtonTransaction = {
    accounts: [],
    actions: [],
    fee: 0,
    primaryUser: "",
    signature: "",
    source: Source.SYSTEM_PROGRAM,
    timestamp: 0,
    type: "UNKNOWN",
};

export type ProtonType = "BURN" | "NFT_SALE" | "NFT_MINT" | "SWAP" | "TRANSFER" | "UNKNOWN" | "TOKEN_MINT" | "STAKE_SOL" | "STAKE_TOKEN";
export type ProtonActionType = keyof typeof ProtonSupportedActionType;
