import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from '@mui/material';

interface FeeUpdateCardProps {
  title: React.ReactNode;
  description: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  helperText: string;
  buttonLabel: string;
  pendingLabel: string;
  buttonColor?: 'secondary' | 'warning' | 'primary';
  icon: React.ReactNode;
  disabled: boolean;
  isPending: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

const FeeUpdateCard: React.FC<FeeUpdateCardProps> = ({
  title,
  description,
  label,
  placeholder,
  value,
  helperText,
  buttonLabel,
  pendingLabel,
  buttonColor = 'secondary',
  icon,
  disabled,
  isPending,
  onChange,
  onSubmit,
}) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <TextField
          label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          helperText={helperText}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <Button
          variant="contained"
          color={buttonColor}
          onClick={onSubmit}
          disabled={disabled || !value}
          startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : icon}
          sx={{ height: 56 }}
        >
          {isPending ? pendingLabel : buttonLabel}
        </Button>
      </Box>
    </CardContent>
  </Card>
);

export default FeeUpdateCard;
