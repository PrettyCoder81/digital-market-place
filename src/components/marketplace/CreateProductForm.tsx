/**
 * CreateProductForm
 * Multi-step product creation: IPFS image upload → fee approval → on-chain create.
 */
import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
} from '@mui/material';
import { Add, CloudUpload, Token } from '@mui/icons-material';
import { useWeb3 } from '../../context/Web3Context';
import { useListingFee } from '../../hooks/useListingFee';
import { approveToken, createProduct } from '../../utils/contractInteractions';
import { runTransaction } from '../../lib/errors';
import { shortHash } from '../../lib/format';
import EmptyState from '../common/EmptyState';
import ImageUploadField from './ImageUploadField';
import type { ShowStatusFn } from '../../types/marketplace';

interface CreateProductFormProps {
  onShowStatus: ShowStatusFn;
}

const STEPS = ['Upload Image to IPFS', 'Approve Listing Fee', 'Create Product on Chain'];

async function uploadImageToIpfs(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  // Backend endpoint for Pinata IPFS uploads (only used by the React frontend)
  const response = await fetch('http://localhost:5000/api/ipfs/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'IPFS upload failed');
  }

  const data = await response.json();
  return data.ipfsHash;
}

const CreateProductForm: React.FC<CreateProductFormProps> = ({ onShowStatus }) => {
  const { isConnected, isCorrectNetwork } = useWeb3();
  const listingFee = useListingFee();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setImageFile(null);
    setImagePreview(null);
    setImageHash('');
    setActiveStep(0);
  };

  const validate = (): string | null => {
    if (!name || !description || !price) return 'Please fill in all fields';
    if (!imageFile) return 'Please upload an image';
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) return 'Please enter a valid price';
    if (!isConnected) return 'Please connect your wallet first';
    if (!isCorrectNetwork) return 'Please switch to Sepolia network';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      onShowStatus(validationError, 'error');
      return;
    }

    await runTransaction({
      action: async () => {
        // Step 1: Upload image to IPFS
        setActiveStep(0);
        setStatusMessage('Uploading image to IPFS...');
        let hash = imageHash;
        if (!hash && imageFile) {
          setUploading(true);
          hash = await uploadImageToIpfs(imageFile);
          setUploading(false);
          setImageHash(hash);
        }

        // Step 2: Approve listing fee
        setActiveStep(1);
        setStatusMessage('Approving TonysCoin for listing fee...');
        await approveToken(listingFee, setStatusMessage);

        // Step 3: Create product on chain
        setActiveStep(2);
        setStatusMessage('Creating product on blockchain...');
        const txHash = await createProduct(name, description, price, `ipfs://${hash}`, setStatusMessage);

        onShowStatus(`Product created successfully! TX: ${shortHash(txHash)}`, 'success');
        resetForm();
      },
      onError: (message) => {
        setUploading(false);
        onShowStatus(message, 'error');
      },
      fallbackMessage: 'Failed to create product',
      onStart: () => setLoading(true),
      onFinish: () => {
        setLoading(false);
        setStatusMessage('');
      },
    });
  };

  if (!isConnected) {
    return (
      <EmptyState
        icon={<Add />}
        title="Connect Your Wallet"
        description="Please connect your wallet to create a product listing."
      />
    );
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        <Add sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
        Create Product
      </Typography>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent sx={{ p: 3 }}>
          {/* Status Alert */}
          {loading && (
            <Alert severity="info" sx={{ mb: 3 }} icon={<CircularProgress size={20} />}>
              {statusMessage || 'Processing...'}
            </Alert>
          )}

          {/* Listing Fee Info */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Token />
              <span>
                Listing fee: <strong>{parseFloat(listingFee).toFixed(0)} TC</strong> — This will be
                deducted from your wallet when creating a product.
              </span>
            </Box>
          </Alert>

          <ImageUploadField
            imagePreview={imagePreview}
            imageHash={imageHash}
            uploading={uploading}
            onChange={(file) => {
              setImageFile(file);
              const reader = new FileReader();
              reader.onloadend = () => setImagePreview(reader.result as string);
              reader.readAsDataURL(file);
              setImageHash('');
            }}
          />

          {/* Product Name */}
          <TextField
            fullWidth
            label="Product Name"
            placeholder="e.g., Digital Art Collection"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 3 }}
            disabled={loading}
            required
          />

          {/* Description */}
          <TextField
            fullWidth
            label="Description"
            placeholder="Describe your product..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
            sx={{ mb: 3 }}
            disabled={loading}
            required
          />

          {/* Price */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Token sx={{ color: 'primary.main', fontSize: 24 }} />
            <TextField
              fullWidth
              label="Price (TC)"
              placeholder="e.g., 25.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={loading}
              required
            />
          </Box>

          {/* Submit Button */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleSubmit}
            disabled={loading || !name || !description || !price || !imageFile}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
            sx={{ py: 1.5, fontSize: '1rem' }}
          >
            {loading ? 'Creating Product...' : 'Create Product Listing'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateProductForm;
