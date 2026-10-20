/** Shorten an Ethereum address to "0xAb12...34cd". */
export function shortenAddress(address?: string | null): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Format a token amount string with sensible precision. */
export function formatAmount(amount?: string, decimals = 4): string {
  const n = parseFloat(amount || '0');
  return isNaN(n) ? '0' : n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

/** Format a TC price (human-readable decimal string). */
export function formatPrice(price: string): string {
  return parseFloat(price || '0').toFixed(2);
}

/** Convert an on-chain unix timestamp (seconds) to a locale date string. */
export function formatDate(timestamp: number): string {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleDateString();
}

/** Truncate a transaction hash for display, e.g. "0xabc123…". */
export function shortHash(txHash: string, length = 10): string {
  return `${txHash.slice(0, length)}…`;
}
