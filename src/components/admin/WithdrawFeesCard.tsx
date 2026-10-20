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
import { Download } from '@mui/icons-material';

interface WithdrawFeesCardProps {
  accruedFees: string;
  amount: string;
  disabled: boolean;
  isPending: boolean;
  onChange: (value: string) => void;
  onWithdraw: () => void;
}

const WithdrawFeesCard: React.FC<WithdrawFeesCardProps> = ({
  accruedFees,
  amount,
  disabled,
  isPending,
  onChange,
  onWithdraw,
}) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        <Download sx={{ mr: 1, verticalAlign: 'middle' }} />
        Withdraw Platform Fees
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Withdraw accrued platform fees. The contract function takes a recipient address and amount.
        Available: <strong>{accruedFees} TC</strong>
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <TextField
          label={`Amount (TC) - Max: ${accruedFees}`}
          value={amount}
          onChange={(e) => onChange(e.target.value)}
          placeholder={accruedFees}
          disabled={disabled}
          sx={{ flex: 1, minWidth: 200 }}
          helperText="Leave empty to withdraw all"
        />
        <Button
          variant="contained"
          onClick={onWithdraw}
          disabled={disabled || parseFloat(accruedFees) === 0}
          startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : <Download />}
          sx={{ height: 56 }}
        >
          {isPending ? 'Withdrawing...' : `Withdraw ${amount || accruedFees} TC`}
        </Button>
      </Box>
    </CardContent>
  </Card>
);

export default WithdrawFeesCard;
