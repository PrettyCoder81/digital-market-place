import React from 'react';
import { Box } from '@mui/material';

export type StatusFilter = 'all' | 'listed' | 'unlisted';

const FilterToolbar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      display: 'flex',
      gap: 2,
      flexWrap: 'wrap',
      alignItems: 'center',
      mb: 3,
      p: 2,
      borderRadius: '14px',
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
    }}
  >
    {children}
  </Box>
);

export default FilterToolbar;
