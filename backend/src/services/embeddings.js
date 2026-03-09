import { EMBEDDING_MODEL } from '../config.js';

const VOYAGE_API = 'https://api.voyageai.com/v1/embeddings';

export async function getEmbedding(text) {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) return null;

  const input = text.slice(0, 32000); // voyage-3 context length
  const res = await fetch(VOYAGE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input,
      model: EMBEDDING_MODEL,
      input_type: 'document',
      truncation: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage AI embeddings: ${res.status} ${err}`);
  }

  const data = await res.json();
  const embedding = data?.data?.[0]?.embedding ?? data?.embeddings?.[0];
  if (!embedding || !Array.isArray(embedding)) throw new Error('Voyage AI: no embedding in response');
  return embedding;
}

export function hasEmbeddingSupport() {
  return !!process.env.VOYAGE_API_KEY;
}
