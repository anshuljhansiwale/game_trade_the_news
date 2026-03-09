// Starting balance in INR (₹1,00,000)
export const STARTING_BALANCE = Number(process.env.STARTING_BALANCE) || 100_000;
export const NEXT_EVENT_INTERVAL_MS = Number(process.env.NEXT_EVENT_INTERVAL_MS) || 60_000;
// Voyage AI embedding model (e.g. voyage-4, voyage-4-large, voyage-finance-2 for finance RAG)
export const EMBEDDING_MODEL = process.env.VOYAGE_EMBEDDING_MODEL || 'voyage-3';
export const EMBEDDING_DIMENSIONS = Number(process.env.VOYAGE_EMBEDDING_DIMENSIONS) || 1024;
