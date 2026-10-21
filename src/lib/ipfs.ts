import { PINATA_GATEWAY } from '../config/contracts';

const IPFS_GATEWAY = `https://${PINATA_GATEWAY}/ipfs/`;

const PLACEHOLDER_COLORS: [string, string][] = [
  ['#10b981', '#059669'],
  ['#6366f1', '#4f46e5'],
  ['#f59e0b', '#d97706'],
  ['#ef4444', '#dc2626'],
  ['#8b5cf6', '#7c3aed'],
  ['#06b6d4', '#0891b2'],
];

export function resolveImageUrl(imageURI: string | undefined, seed: number, name: string): string {
  if (!imageURI) return generatePlaceholderImage(seed, name);

  if (imageURI.startsWith('Qm') || imageURI.startsWith('ipfs://')) {
    return `${IPFS_GATEWAY}${imageURI.replace('ipfs://', '')}`;
  }
  if (imageURI.startsWith('http://') || imageURI.startsWith('https://')) {
    return imageURI;
  }
  return `${IPFS_GATEWAY}${imageURI}`;
}

export function generatePlaceholderImage(productId: number, name: string): string {
  const [from, to] = PLACEHOLDER_COLORS[productId % PLACEHOLDER_COLORS.length];
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${from}"/>
          <stop offset="100%" style="stop-color:${to}"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#g)"/>
      <text x="200" y="150" text-anchor="middle" fill="white" font-size="18" font-family="Arial" dy=".3em">${name.slice(0, 20)}</text>
    </svg>`
  )}`;
}
