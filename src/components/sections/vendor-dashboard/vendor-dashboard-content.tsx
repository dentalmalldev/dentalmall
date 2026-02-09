'use client';

import { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/providers';
import { VendorGuard } from '@/components/common';
import { VendorDashboardLayout } from './vendor-dashboard-layout';
import { VendorOverview } from './vendor-overview';
import { VendorProducts } from './vendor-products';
import { VendorOrders } from './vendor-orders';
import { Vendor } from '@/types/models';

export function VendorDashboardContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, [user]);

  const fetchVendors = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/vendors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
        if (data.length === 1) {
          setSelectedVendorId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const vendorIdForApi = selectedVendorId === 'all' ? undefined : selectedVendorId;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <VendorGuard>
      <VendorDashboardLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        vendors={vendors}
        selectedVendorId={selectedVendorId}
        onVendorChange={setSelectedVendorId}
      >
        {activeTab === 0 && <VendorOverview vendorId={vendorIdForApi} />}
        {activeTab === 1 && <VendorProducts vendorId={vendorIdForApi} />}
        {activeTab === 2 && <VendorOrders vendorId={vendorIdForApi} />}
      </VendorDashboardLayout>
    </VendorGuard>
  );
}
