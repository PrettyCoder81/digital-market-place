/**
 * ImageUploadField
 * Click-to-upload image picker with local preview and IPFS upload status.
 */
import React, { useRef } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Typography,
  useTheme,
} from '@mui/material';
import { CheckCircle, Image as ImageIcon } from '@mui/icons-material';

interface ImageUploadFieldProps {
  imagePreview: string | null;
  imageHash: string;
  uploading: boolean;
  onChange: (file: File) => void;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  imagePreview,
  imageHash,
  uploading,
  onChange,
}) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
        Product Image
      </Typography>
      <Box
        sx={{
          border: `2px dashed ${theme.palette.divider}`,
          borderRadius: '16px',
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor:
              theme.palette.mode === 'dark'
                ? 'rgba(16, 185, 129, 0.05)'
                : 'rgba(16, 185, 129, 0.03)',
          },
        }}
        onClick={() => inputRef.current?.click()}
      >
        {imagePreview ? (
          <Box>
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: 200,
                borderRadius: '12px',
                objectFit: 'cover',
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Click to change image
            </Typography>
          </Box>
        ) : (
          <Box>
            <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary">Click to upload or drag and drop</Typography>
            <Typography variant="caption" color="text.secondary">
              PNG, JPG, GIF up to 10MB
            </Typography>
          </Box>
        )}
      </Box>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
        }}
        style={{ display: 'none' }}
      />
      {uploading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            Uploading to IPFS...
          </Typography>
        </Box>
      )}
      {imageHash && (
        <Alert severity="success" sx={{ mt: 1 }} icon={<CheckCircle />}>
          Image uploaded to IPFS: {imageHash.slice(0, 16)}...
        </Alert>
      )}
    </Box>
  );
};

export default ImageUploadField;
