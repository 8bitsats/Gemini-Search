export * from './types';
export * from './parser';

// Known program IDs and their names
export const PROGRAM_IDS = {
  SYSTEM_PROGRAM: '11111111111111111111111111111111',
  TOKEN_PROGRAM: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  ASSOCIATED_TOKEN: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  METADATA_PROGRAM: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  MEMO_PROGRAM: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
  NAME_PROGRAM: 'namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX',
  RAYDIUM_V4: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  ORCA_V2: '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP',
  JUPITER_V3: 'JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph',
  MAGIC_EDEN_V2: 'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K',
};

// Helper to get program name from ID
export const getProgramName = (programId: string): string => {
  const knownPrograms = Object.entries(PROGRAM_IDS);
  const program = knownPrograms.find(([_, id]) => id === programId);
  return program ? program[0] : programId;
};
