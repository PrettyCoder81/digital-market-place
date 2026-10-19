import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  CloudUpload,
  Add,
  Image as ImageIcon,
  CheckCircle,
  Token,
} from '@mui/icons-material';
import { useWeb3 } from '../context/Web3Context';
import {
  approveToken,
  createProduct,
  getListingFee,
} from '../utils/contractInteractions';

interface CreateProductFormProps {
  onShowStatus: (message: string, severity: 'success' | 'error' | 'info') => void;
}

const CreateProductForm: React.FC<CreateProductFormProps> = ({ onShowStatus }) => {
  const { isConnected, isCorrectNetwork, account } = useWeb3();
  const theme = useTheme();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState('');
  const [listingFee, setListingFee] = useState('10');
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const steps = [
    'Upload Image to IPFS',
    'Approve Listing Fee',
    'Create Product on Chain',
  ];

  useEffect(() => {
    const fetchListingFee = async () => {
      try {
        const fee = await getListingFee();
        setListingFee(fee);
      } catch {
        setListingFee('10');
      }
    };
    if (isConnected) {
      fetchListingFee();
    }
  }, [isConnected]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setImageHash('');
    }
  };

  const uploadToIPFS = async (): Promise<string> => {
    if (!imageFile) throw new Error('No image selected');
    
    setUploading(true);
    setStatusMessage('Uploading image to IPFS via Pinata...');

    try {
      // In production, this would call the backend API
      // POST /api/ipfs/upload
      // For demo purposes, we'll simulate the upload
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('http://localhost:5000/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'IPFS upload failed');
      }

      const data = await response.json();
      setUploading(false);
      return data.ipfsHash;
    } catch (error) {
      setUploading(false);
      throw new Error('Failed to upload image to IPFS');
    }
  };

  const handleSubmit = async () => {
    if (!name || !description || !price) {
      onShowStatus('Please fill in all fields', 'error');
      return;
    }
    if (!imageFile) {
      onShowStatus('Please upload an image', 'error');
      return;
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      onShowStatus('Please enter a valid price', 'error');
      return;
    }
    if (!isConnected) {
      onShowStatus('Please connect your wallet first', 'error');
      return;
    }
    if (!isCorrectNetwork) {
      onShowStatus('Please switch to Sepolia network', 'error');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Upload image to IPFS
      setActiveStep(0);
      setStatusMessage('Uploading image to IPFS...');
      let hash = imageHash;
      if (!hash) {
        hash = await uploadToIPFS();
        setImageHash(hash);
      }

      // Step 2: Approve listing fee
      setActiveStep(1);
      setStatusMessage('Approving TonysCoin for listing fee...');
      await approveToken(listingFee, (status: string) => setStatusMessage(status));

      // Step 3: Create product
      setActiveStep(2);
      setStatusMessage('Creating product on blockchain...');
      // createProduct(name, description, price, imageURI, onStatus)
      const imageURI = `ipfs://${hash}`;
      const txHash = await createProduct(name, description, price, imageURI, (status: string) => setStatusMessage(status));

      onShowStatus(`Product created successfully! TX: ${txHash.slice(0, 10)}...`, 'success');
      
      // Reset form
      setName('');
      setDescription('');
      setPrice('');
      setImageFile(null);
      setImagePreview(null);
      setImageHash('');
      setActiveStep(0);
    } catch (error: any) {
      console.error('Create product error:', error);
      const message = error.code === 4001
        ? 'Transaction rejected by user'
        : error.reason || error.message || 'Failed to create product';
      onShowStatus(message, 'error');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  if (!isConnected) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Add sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Connect Your Wallet
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please connect your wallet to create a product listing.
        </Typography>
      </Box>
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
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent sx={{ p: 3 }}>
          {/* Status Alert */}
          {loading && (
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
              icon={<CircularProgress size={20} />}
            >
              {statusMessage || 'Processing...'}
            </Alert>
          )}

          {/* Listing Fee Info */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Token />
              <span>
                Listing fee: <strong>{parseFloat(listingFee).toFixed(0)} TC</strong> — 
                This will be deducted from your wallet when creating a product.
              </span>
            </Box>
          </Alert>

          {/* Image Upload */}
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
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(16, 185, 129, 0.05)' 
                    : 'rgba(16, 185, 129, 0.03)',
                },
              }}
              onClick={() => document.getElementById('image-upload')?.click()}
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
                  <Typography color="text.secondary">
                    Click to upload or drag and drop
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PNG, JPG, GIF up to 10MB
                  </Typography>
                </Box>
              )}
            </Box>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
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
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CloudUpload />
              )
            }
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
