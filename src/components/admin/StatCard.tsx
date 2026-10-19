/**
 * StatCard
 * Small metric card used on the admin dashboard.
 */
import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

interface StatCardProps {
  icon?: React.ReactNode;
  emoji?: string;
  value: React.ReactNode;
  label: string;
  sublabel?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

const StatCard: React.FC<StatCardProps> = ({ icon, emoji, value, label, sublabel, color = 'primary' }) => (
  <Card sx={{ height: '170px' }}>
    <CardContent sx={{ textAlign: 'center' }}>
      {emoji ? (
        <Typography sx={{ fontSize: 40, mb: 1 }}>{emoji}</Typography>
      ) : (
        icon && (
          <BoxedIcon color={color}>{icon}</BoxedIcon>
        )
      )}
      <Typography variant="h4" color={sublabel ? undefined : color} sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {sublabel}
    </CardContent>
  </Card>
);

const BoxedIcon: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <React.Fragment>
    {React.isValidElement(children)
      ? React.cloneElement(children as React.ReactElement<any>, {
          sx: { fontSize: 40, color: `${color}.main`, mb: 1 },
        })
      : children}
  </React.Fragment>
);

export default StatCard;
