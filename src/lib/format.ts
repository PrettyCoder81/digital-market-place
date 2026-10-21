export function shortenAddress(address?: string | null): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatAmount(amount?: string, decimals = 4): string {
  const n = parseFloat(amount || '0');
  return isNaN(n) ? '0' : n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export function formatPrice(price: string): string {
  return parseFloat(price || '0').toFixed(2);
}

export function formatDate(timestamp: number): string {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function shortHash(txHash: string, length = 10): string {
  return `${txHash.slice(0, length)}…`;
}
