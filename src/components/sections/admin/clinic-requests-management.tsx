'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers';
import { ClinicRequest, ClinicRequestStatus } from '@/types/models';

export function ClinicRequestsManagement() {
  const ta = useTranslations('admin');
  const tc = useTranslations('clinic');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ClinicRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ClinicRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/clinic-requests', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (request: ClinicRequest, actionType: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setAction(actionType);
    setAdminNotes('');
    setDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!user || !selectedRequest || !action) return;

    setProcessing(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/clinic-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          admin_notes: adminNotes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process request');
      }

      setDialogOpen(false);
      fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: ClinicRequestStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (status: ClinicRequestStatus) => {
    switch (status) {
      case 'APPROVED':
        return ta('approved');
      case 'REJECTED':
        return ta('rejected');
      case 'PENDING':
      default:
        return ta('pending');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        {ta('clinicRequests')}
      </Typography>

      {requests.length === 0 ? (
        <Alert severity="info">{ta('noRequests')}</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{tc('clinicName')}</TableCell>
                <TableCell>{tc('identificationNumber')}</TableCell>
                <TableCell>{tc('email')}</TableCell>
                <TableCell>{tc('city')}</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.clinic_name}</TableCell>
                  <TableCell>{request.identification_number}</TableCell>
                  <TableCell>{request.email}</TableCell>
                  <TableCell>{request.city}</TableCell>
                  <TableCell>
                    {request.user?.first_name} {request.user?.last_name}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {request.user?.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(request.status)}
                      color={getStatusColor(request.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {request.status === 'PENDING' && (
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleAction(request, 'approve')}
                        >
                          {ta('approve')}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleAction(request, 'reject')}
                        >
                          {ta('reject')}
                        </Button>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {action === 'approve' ? ta('approve') : ta('reject')} - {selectedRequest?.clinic_name}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label={ta('adminNotes')}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={action === 'approve' ? 'success' : 'error'}
            onClick={handleConfirmAction}
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : action === 'approve' ? ta('approve') : ta('reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
