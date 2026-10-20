import React from 'react';
import { Box, Chip, Grid, Typography } from '@mui/material';

interface MarketplaceHeroProps {
  listedCount: number;
  unlistedCount: number;
  actions?: React.ReactNode;
}

export const MarketplaceHero: React.FC<MarketplaceHeroProps> = ({
  listedCount,
  unlistedCount,
  actions,
}) => (
  <Box
    sx={{
      background: (theme) =>
        theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)'
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
      borderRadius: '20px',
      p: { xs: 3, md: 5 },
      mb: 4,
      border: '1px solid',
      borderColor: 'divider',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
      }}
    />
    <Typography
      variant="h3"
      sx={{
        fontWeight: 800,
        mb: 1,
        background: 'linear-gradient(135deg, #10b981, #059669)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: { xs: '1.8rem', md: '2.5rem' },
      }}
    >
      Digital Marketplace
    </Typography>
    <Typography variant="h6" color="text.secondary" sx={{ mb: 2, maxWidth: 600 }}>
      Discover, buy, and sell unique digital products powered by TonysCoin on Ethereum Sepolia. Fully
      decentralized, transparent, and secure.
    </Typography>
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      <Chip label={`${listedCount} Listed`} color="primary" variant="filled" sx={{ fontWeight: 600 }} />
      <Chip label={`${unlistedCount} Unlisted`} variant="outlined" sx={{ fontWeight: 600 }} />
      <Chip label="Sepolia Testnet" variant="outlined" color="secondary" size="small" />
      {actions}
    </Box>
  </Box>
);

const FEATURES = [
  { icon: '🔒', title: 'Secure', desc: 'Smart contract escrow with platform fee' },
  { icon: '🌐', title: 'Decentralized', desc: 'IPFS storage, blockchain verified' },
  { icon: '💎', title: 'TonysCoin', desc: 'Exclusive TC payments, no ETH needed' },
];

export const FeatureStrip: React.FC = () => (
  <Grid container spacing={2} sx={{ mb: 4 }}>
    {FEATURES.map((feature) => (
      <Grid size={{ xs: 12, sm: 4 }} key={feature.title}>
        <Box
          sx={{
            p: 2.5,
            borderRadius: '14px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            textAlign: 'center',
            height: '100%',
          }}
        >
          <Typography sx={{ fontSize: '1.8rem', mb: 0.5 }}>{feature.icon}</Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            {feature.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {feature.desc}
          </Typography>
        </Box>
      </Grid>
    ))}
  </Grid>
);

export const Footer: React.FC = () => (
  <Box
    component="footer"
    sx={{
      py: 3,
      px: 2,
      mt: 'auto',
      borderTop: 1,
      borderColor: 'divider',
      textAlign: 'center',
    }}
  >
    <Typography variant="body2" color="text.secondary">
      TonysCoin Digital Marketplace • Ethereum Sepolia Testnet
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
      Powered by Web3 • IPFS Storage • Decentralized
    </Typography>
  </Box>
);
