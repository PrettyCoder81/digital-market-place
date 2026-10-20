import React from 'react';
import { Box, Typography } from '@mui/material';

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, emoji, title, description, children }) => (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    {emoji && (
      <Typography variant="h4" color="text.secondary" sx={{ mb: 1 }}>
        {emoji}
      </Typography>
    )}
    {icon && (
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', '& svg': { fontSize: 64, color: 'text.secondary' } }}>
        {icon}
      </Box>
    )}
    <Typography variant="h5" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    {description && (
      <Typography variant="body1" color="text.secondary">
        {description}
      </Typography>
    )}
    {children}
  </Box>
);

export default EmptyState;
