'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserTabOrders } from './user-tab-orders';
import { UserTabCart } from './user-tab-cart';
import { UserTabActivity } from './user-tab-activity';
import { UserTabEmail } from './user-tab-email';
import { UserTabPayments } from './user-tab-payments';
import { UserTabRefund } from './user-tab-refund';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Stack,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  IconButton,
  Divider,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Close,
  Add,
  Edit,
  Delete,
  Star,
  StarBorder,
  LockReset,
  Logout as LogoutIcon,
  ContentCopy,
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers';
import { Role, Address } from '@/types/models';

interface VendorData {
  id: string;
  company_name: string;
  identification_number: string;
  email: string;
  description: string | null;
  city: string;
  address: string;
  phone_number: string;
  logo: string | null;
  is_active: boolean;
  _count: { products: number };
}

interface ClinicData {
  id: string;
  clinic_name: string;
  identification_number: string;
  email: string;
  description: string | null;
  city: string;
  address: string;
  phone_number: string;
  is_active: boolean;
}

interface FullUser {
  id: string;
  firebase_uid: string;
  email: string;
  first_name: string;
  last_name: string;
  personal_id: string | null;
  auth_provider: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  cartItems: number;
}

interface UserEditModalProps {
  userId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export function UserEditModal({ userId, onClose, onUpdated }: UserEditModalProps) {
  const t = useTranslations('admin');
  const { user: authUser } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [userData, setUserData] = useState<FullUser | null>(null);
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);

  // Basic info form
  const [basicForm, setBasicForm] = useState({
    first_name: '', last_name: '', email: '', personal_id: '', role: 'USER' as Role, is_active: true,
  });

  // Vendor form
  const [vendorForm, setVendorForm] = useState({
    company_name: '', identification_number: '', email: '', description: '', city: '', address: '', phone_number: '', is_active: true,
  });

  // Clinic form
  const [clinicForm, setClinicForm] = useState({
    clinic_name: '', identification_number: '', email: '', description: '', city: '', address: '', phone_number: '', is_active: true,
  });

  // Address editing
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ recipient_name: '', mobile_number: '', city: '', address: '', postal_code: '', is_default: false });

  const fetchUser = useCallback(async () => {
    if (!authUser || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      setUserData(data.user);
      setVendor(data.vendor);
      setClinic(data.clinic);
      setAddresses(data.addresses);
      setStats(data.stats);

      setBasicForm({
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        email: data.user.email,
        personal_id: data.user.personal_id || '',
        role: data.user.role,
        is_active: data.user.is_active,
      });

      if (data.vendor) {
        setVendorForm({
          company_name: data.vendor.company_name,
          identification_number: data.vendor.identification_number,
          email: data.vendor.email,
          description: data.vendor.description || '',
          city: data.vendor.city,
          address: data.vendor.address,
          phone_number: data.vendor.phone_number,
          is_active: data.vendor.is_active,
        });
      }

      if (data.clinic) {
        setClinicForm({
          clinic_name: data.clinic.clinic_name,
          identification_number: data.clinic.identification_number,
          email: data.clinic.email,
          description: data.clinic.description || '',
          city: data.clinic.city,
          address: data.clinic.address,
          phone_number: data.clinic.phone_number,
          is_active: data.clinic.is_active,
        });
      }
    } catch {
      setError(t('actionFailed'));
    } finally {
      setLoading(false);
    }
  }, [authUser, userId, t]);

  useEffect(() => {
    if (userId) {
      setActiveTab(0);
      fetchUser();
    }
  }, [userId, fetchUser]);

  const apiCall = async (path: string, method: string, body?: object) => {
    const token = await authUser!.getIdToken();
    const res = await fetch(path, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  };

  const handleSaveBasic = async () => {
    setSaving('basic');
    setError(null);
    try {
      await apiCall(`/api/admin/users/${userId}`, 'PATCH', basicForm);
      setSuccess(t('changesSaved'));
      onUpdated();
      fetchUser();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('actionFailed'));
    } finally {
      setSaving(null);
    }
  };

  const handleSaveVendor = async () => {
    setSaving('vendor');
    setError(null);
    try {
      await apiCall(`/api/admin/users/${userId}/vendor`, 'PATCH', vendorForm);
      setSuccess(t('changesSaved'));
      fetchUser();
    } catch {
      setError(t('actionFailed'));
    } finally {
      setSaving(null);
    }
  };

  const handleSaveClinic = async () => {
    setSaving('clinic');
    setError(null);
    try {
      await apiCall(`/api/admin/users/${userId}/clinic`, 'PATCH', clinicForm);
      setSuccess(t('changesSaved'));
      fetchUser();
    } catch {
      setError(t('actionFailed'));
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAddress = async () => {
    setSaving('address');
    setError(null);
    try {
      if (editingAddress) {
        await apiCall(`/api/admin/users/${userId}/addresses/${editingAddress.id}`, 'PATCH', addressForm);
      } else {
        await apiCall(`/api/admin/users/${userId}/addresses`, 'POST', addressForm);
      }
      setSuccess(t('changesSaved'));
      setEditingAddress(null);
      setAddingAddress(false);
      fetchUser();
    } catch {
      setError(t('actionFailed'));
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setSaving('address');
    setError(null);
    try {
      await apiCall(`/api/admin/users/${userId}/addresses/${addressId}`, 'DELETE');
      setSuccess(t('changesSaved'));
      fetchUser();
    } catch {
      setError(t('actionFailed'));
    } finally {
      setSaving(null);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    setSaving('address');
    try {
      await apiCall(`/api/admin/users/${userId}/addresses/${addressId}`, 'PATCH', { is_default: true });
      fetchUser();
    } catch {
      setError(t('actionFailed'));
    } finally {
      setSaving(null);
    }
  };

  const handleResetPassword = async () => {
    setSaving('security');
    setError(null);
    try {
      const data = await apiCall(`/api/admin/users/${userId}/reset-password`, 'POST');
      setSuccess(`${t('passwordResetGenerated')}: ${data.reset_link}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('actionFailed'));
    } finally {
      setSaving(null);
    }
  };

  const handleForceLogout = async () => {
    setSaving('security');
    setError(null);
    try {
      await apiCall(`/api/admin/users/${userId}/force-logout`, 'POST');
      setSuccess(t('sessionsRevoked'));
    } catch {
      setError(t('actionFailed'));
    } finally {
      setSaving(null);
    }
  };

  const startEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddingAddress(false);
    setAddressForm({
      recipient_name: addr.recipient_name,
      mobile_number: addr.mobile_number,
      city: addr.city,
      address: addr.address,
      postal_code: addr.postal_code || '',
      is_default: addr.is_default,
    });
  };

  const startAddAddress = () => {
    setAddingAddress(true);
    setEditingAddress(null);
    setAddressForm({ recipient_name: '', mobile_number: '', city: '', address: '', postal_code: '', is_default: false });
  };

  const cancelAddressEdit = () => {
    setEditingAddress(null);
    setAddingAddress(false);
  };

  const tabs = [
    t('basicInfo'),
    t('addressesTab'),
    ...(vendor ? [t('vendorInfo')] : []),
    ...(clinic ? [t('clinicInfo')] : []),
    t('security'),
    t('statistics'),
    t('orderHistory'),
    t('cartItems'),
    t('activityLog'),
    t('sendEmail'),
    t('paymentHistory'),
    t('issueRefund'),
  ];

  // Map tab index to logical section
  const getSection = (idx: number) => {
    if (idx === 0) return 'basic';
    if (idx === 1) return 'addresses';
    if (vendor && idx === 2) return 'vendor';
    if (clinic && idx === (vendor ? 3 : 2)) return 'clinic';
    const secIdx = 2 + (vendor ? 1 : 0) + (clinic ? 1 : 0);
    if (idx === secIdx) return 'security';
    return 'stats';
  };

  return (
    <Dialog open={!!userId} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', minHeight: '70vh' } }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            {userData && (
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                {userData.first_name[0]?.toUpperCase()}
              </Avatar>
            )}
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {userData ? `${userData.first_name} ${userData.last_name}` : t('editUser')}
              </Typography>
              {userData && (
                <Typography variant="caption" color="text.secondary">{userData.email}</Typography>
              )}
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
            <Tabs value={activeTab} onChange={(_e, v) => { setActiveTab(v); setError(null); setSuccess(null); }} variant="scrollable" scrollButtons="auto">
              {tabs.map((label) => (
                <Tab key={label} label={label} sx={{ textTransform: 'none', fontWeight: 500 }} />
              ))}
            </Tabs>
          </Box>

          <DialogContent sx={{ px: 3, py: 0 }}>
            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 2 }}>{error}</Alert>}
            {success && (
              <Alert
                severity="success"
                onClose={() => setSuccess(null)}
                sx={{ mt: 2 }}
                action={success.includes('http') ? (
                  <Tooltip title={t('copyLink')}>
                    <IconButton size="small" onClick={() => navigator.clipboard.writeText(success.split(': ')[1])}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : undefined}
              >
                {success.includes('http') ? success.split(': ')[0] : success}
              </Alert>
            )}

            {/* BASIC INFO */}
            <TabPanel value={activeTab} index={0}>
              <Stack spacing={2.5}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField fullWidth label={t('firstName')} value={basicForm.first_name} onChange={(e) => setBasicForm((f) => ({ ...f, first_name: e.target.value }))} size="small" />
                  <TextField fullWidth label={t('lastName')} value={basicForm.last_name} onChange={(e) => setBasicForm((f) => ({ ...f, last_name: e.target.value }))} size="small" />
                </Stack>
                <TextField fullWidth label={t('emailLabel')} value={basicForm.email} onChange={(e) => setBasicForm((f) => ({ ...f, email: e.target.value }))} size="small" type="email" />
                <TextField fullWidth label={t('personalId')} value={basicForm.personal_id} onChange={(e) => setBasicForm((f) => ({ ...f, personal_id: e.target.value }))} size="small" />
                <FormControl fullWidth size="small">
                  <InputLabel>{t('role')}</InputLabel>
                  <Select value={basicForm.role} label={t('role')} onChange={(e) => setBasicForm((f) => ({ ...f, role: e.target.value as Role }))}>
                    <MenuItem value="USER">USER</MenuItem>
                    <MenuItem value="VENDOR">VENDOR</MenuItem>
                    <MenuItem value="CLINIC">CLINIC</MenuItem>
                    <MenuItem value="ACCOUNTANT">ACCOUNTANT</MenuItem>
                    <MenuItem value="STORAGE">STORAGE</MenuItem>
                    <MenuItem value="ADMIN">ADMIN</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={<Switch checked={basicForm.is_active} onChange={(e) => setBasicForm((f) => ({ ...f, is_active: e.target.checked }))} color="success" />}
                  label={<Typography variant="body2">{t('accountActive')}</Typography>}
                />
                {userData && (
                  <Stack direction="row" spacing={1}>
                    <Chip label={userData.auth_provider} size="small" variant="outlined" />
                    <Chip label={`ID: ${userData.id.slice(0, 8)}...`} size="small" variant="outlined" />
                  </Stack>
                )}
              </Stack>
            </TabPanel>

            {/* ADDRESSES */}
            <TabPanel value={activeTab} index={1}>
              <Stack spacing={2}>
                {addresses.length === 0 && !addingAddress && (
                  <Typography color="text.secondary" variant="body2">{t('noAddresses')}</Typography>
                )}
                {addresses.map((addr) => (
                  <Paper key={addr.id} variant="outlined" sx={{ p: 2, borderRadius: '10px' }}>
                    {editingAddress?.id === addr.id ? (
                      <AddressForm form={addressForm} setForm={setAddressForm} onSave={handleSaveAddress} onCancel={cancelAddressEdit} saving={saving === 'address'} t={t} />
                    ) : (
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                            <Typography variant="body2" fontWeight={600}>{addr.recipient_name}</Typography>
                            {addr.is_default && <Chip label={t('default')} size="small" color="primary" sx={{ height: 18, fontSize: 11 }} />}
                          </Stack>
                          <Typography variant="body2" color="text.secondary">{addr.mobile_number}</Typography>
                          <Typography variant="body2" color="text.secondary">{addr.city}, {addr.address}{addr.postal_code ? `, ${addr.postal_code}` : ''}</Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          {!addr.is_default && (
                            <Tooltip title={t('setDefault')}>
                              <IconButton size="small" onClick={() => handleSetDefaultAddress(addr.id)} disabled={!!saving}>
                                <StarBorder fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {addr.is_default && <Star fontSize="small" sx={{ color: 'warning.main', mt: 1 }} />}
                          <Tooltip title={t('edit')}>
                            <IconButton size="small" onClick={() => startEditAddress(addr)} disabled={!!saving}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('delete')}>
                            <IconButton size="small" color="error" onClick={() => handleDeleteAddress(addr.id)} disabled={!!saving}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    )}
                  </Paper>
                ))}
                {addingAddress && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: '10px' }}>
                    <AddressForm form={addressForm} setForm={setAddressForm} onSave={handleSaveAddress} onCancel={cancelAddressEdit} saving={saving === 'address'} t={t} />
                  </Paper>
                )}
                {!addingAddress && !editingAddress && (
                  <Button startIcon={<Add />} onClick={startAddAddress} variant="outlined" sx={{ borderRadius: '8px', alignSelf: 'flex-start' }}>
                    {t('addAddress')}
                  </Button>
                )}
              </Stack>
            </TabPanel>

            {/* VENDOR INFO */}
            {vendor && (
              <TabPanel value={activeTab} index={2}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={`${vendor._count.products} ${t('products')}`} size="small" color="primary" />
                    <FormControlLabel
                      control={<Switch checked={vendorForm.is_active} onChange={(e) => setVendorForm((f) => ({ ...f, is_active: e.target.checked }))} color="success" size="small" />}
                      label={<Typography variant="body2">{t('vendorActive')}</Typography>}
                    />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth label={t('companyName')} value={vendorForm.company_name} onChange={(e) => setVendorForm((f) => ({ ...f, company_name: e.target.value }))} size="small" />
                    <TextField fullWidth label={t('identificationNumber')} value={vendorForm.identification_number} onChange={(e) => setVendorForm((f) => ({ ...f, identification_number: e.target.value }))} size="small" />
                  </Stack>
                  <TextField fullWidth label={t('emailLabel')} value={vendorForm.email} onChange={(e) => setVendorForm((f) => ({ ...f, email: e.target.value }))} size="small" type="email" />
                  <TextField fullWidth label={t('description')} value={vendorForm.description} onChange={(e) => setVendorForm((f) => ({ ...f, description: e.target.value }))} size="small" multiline rows={3} />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth label={t('city')} value={vendorForm.city} onChange={(e) => setVendorForm((f) => ({ ...f, city: e.target.value }))} size="small" />
                    <TextField fullWidth label={t('address')} value={vendorForm.address} onChange={(e) => setVendorForm((f) => ({ ...f, address: e.target.value }))} size="small" />
                  </Stack>
                  <TextField fullWidth label={t('phone')} value={vendorForm.phone_number} onChange={(e) => setVendorForm((f) => ({ ...f, phone_number: e.target.value }))} size="small" />
                </Stack>
              </TabPanel>
            )}

            {/* CLINIC INFO */}
            {clinic && (
              <TabPanel value={activeTab} index={vendor ? 3 : 2}>
                <Stack spacing={2.5}>
                  <FormControlLabel
                    control={<Switch checked={clinicForm.is_active} onChange={(e) => setClinicForm((f) => ({ ...f, is_active: e.target.checked }))} color="success" size="small" />}
                    label={<Typography variant="body2">{t('clinicActive')}</Typography>}
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth label={t('clinicName')} value={clinicForm.clinic_name} onChange={(e) => setClinicForm((f) => ({ ...f, clinic_name: e.target.value }))} size="small" />
                    <TextField fullWidth label={t('identificationNumber')} value={clinicForm.identification_number} onChange={(e) => setClinicForm((f) => ({ ...f, identification_number: e.target.value }))} size="small" />
                  </Stack>
                  <TextField fullWidth label={t('emailLabel')} value={clinicForm.email} onChange={(e) => setClinicForm((f) => ({ ...f, email: e.target.value }))} size="small" type="email" />
                  <TextField fullWidth label={t('description')} value={clinicForm.description} onChange={(e) => setClinicForm((f) => ({ ...f, description: e.target.value }))} size="small" multiline rows={3} />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth label={t('city')} value={clinicForm.city} onChange={(e) => setClinicForm((f) => ({ ...f, city: e.target.value }))} size="small" />
                    <TextField fullWidth label={t('address')} value={clinicForm.address} onChange={(e) => setClinicForm((f) => ({ ...f, address: e.target.value }))} size="small" />
                  </Stack>
                  <TextField fullWidth label={t('phone')} value={clinicForm.phone_number} onChange={(e) => setClinicForm((f) => ({ ...f, phone_number: e.target.value }))} size="small" />
                </Stack>
              </TabPanel>
            )}

            {/* SECURITY */}
            <TabPanel value={activeTab} index={2 + (vendor ? 1 : 0) + (clinic ? 1 : 0)}>
              <Stack spacing={3}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '10px' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('passwordReset')}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>{t('passwordResetDesc')}</Typography>
                  <Button
                    variant="outlined"
                    startIcon={saving === 'security' ? <CircularProgress size={18} /> : <LockReset />}
                    onClick={handleResetPassword}
                    disabled={!!saving || userData?.auth_provider !== 'EMAIL'}
                    sx={{ borderRadius: '8px' }}
                  >
                    {t('generateResetLink')}
                  </Button>
                  {userData?.auth_provider !== 'EMAIL' && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>{t('socialLoginNoReset')}</Typography>
                  )}
                </Paper>

                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '10px', borderColor: 'error.light' }}>
                  <Typography variant="subtitle2" fontWeight={600} color="error" gutterBottom>{t('forceLogout')}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>{t('forceLogoutDesc')}</Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={saving === 'security' ? <CircularProgress size={18} /> : <LogoutIcon />}
                    onClick={handleForceLogout}
                    disabled={!!saving}
                    sx={{ borderRadius: '8px' }}
                  >
                    {t('revokeAllSessions')}
                  </Button>
                </Paper>
              </Stack>
            </TabPanel>

            {/* STATISTICS */}
            <TabPanel value={activeTab} index={3 + (vendor ? 1 : 0) + (clinic ? 1 : 0)}>
              {stats && userData && (
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    {[
                      { label: t('totalOrders'), value: stats.totalOrders },
                      { label: t('totalSpent'), value: `₾${stats.totalSpent.toFixed(2)}` },
                      { label: t('cartItems'), value: stats.cartItems },
                    ].map((s) => (
                      <Paper key={s.label} variant="outlined" sx={{ flex: 1, p: 2.5, borderRadius: '10px', textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={700} color="primary.main">{s.value}</Typography>
                        <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                      </Paper>
                    ))}
                  </Stack>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '10px' }}>
                    {[
                      { label: t('registrationDate'), value: new Date(userData.created_at).toLocaleString() },
                      { label: t('lastUpdated'), value: new Date(userData.updated_at).toLocaleString() },
                      { label: t('firebaseUid'), value: userData.firebase_uid },
                    ].map(({ label, value }) => (
                      <Stack key={label} direction="row" justifyContent="space-between" py={1} sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { border: 'none' } }}>
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-all', maxWidth: '60%', textAlign: 'right' }}>{value}</Typography>
                      </Stack>
                    ))}
                  </Paper>
                </Stack>
              )}
            </TabPanel>

            {/* ORDER HISTORY */}
            <TabPanel value={activeTab} index={4 + (vendor ? 1 : 0) + (clinic ? 1 : 0)}>
              <UserTabOrders userId={userId!} />
            </TabPanel>

            {/* CART ITEMS */}
            <TabPanel value={activeTab} index={5 + (vendor ? 1 : 0) + (clinic ? 1 : 0)}>
              <UserTabCart userId={userId!} />
            </TabPanel>

            {/* ACTIVITY LOG */}
            <TabPanel value={activeTab} index={6 + (vendor ? 1 : 0) + (clinic ? 1 : 0)}>
              <UserTabActivity userId={userId!} />
            </TabPanel>

            {/* SEND EMAIL */}
            <TabPanel value={activeTab} index={7 + (vendor ? 1 : 0) + (clinic ? 1 : 0)}>
              <UserTabEmail userId={userId!} userEmail={userData?.email || ''} />
            </TabPanel>

            {/* PAYMENT HISTORY */}
            <TabPanel value={activeTab} index={8 + (vendor ? 1 : 0) + (clinic ? 1 : 0)}>
              <UserTabPayments userId={userId!} />
            </TabPanel>

            {/* ISSUE REFUND */}
            <TabPanel value={activeTab} index={9 + (vendor ? 1 : 0) + (clinic ? 1 : 0)}>
              <UserTabRefund userId={userId!} />
            </TabPanel>

          </DialogContent>

          {/* Save buttons (not shown for addresses/security/stats/bonus tabs) */}
          {!['addresses', 'security', 'stats'].includes(getSection(activeTab)) && activeTab < (4 + (vendor ? 1 : 0) + (clinic ? 1 : 0)) && (
            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button onClick={onClose} sx={{ borderRadius: '8px' }}>{t('cancel')}</Button>
              <Button
                variant="contained"
                onClick={
                  getSection(activeTab) === 'basic' ? handleSaveBasic :
                  getSection(activeTab) === 'vendor' ? handleSaveVendor :
                  handleSaveClinic
                }
                disabled={!!saving}
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
                sx={{ borderRadius: '8px' }}
              >
                {t('save')}
              </Button>
            </DialogActions>
          )}
        </>
      )}
    </Dialog>
  );
}

interface AddressFormProps {
  form: { recipient_name: string; mobile_number: string; city: string; address: string; postal_code: string; is_default: boolean };
  setForm: React.Dispatch<React.SetStateAction<{ recipient_name: string; mobile_number: string; city: string; address: string; postal_code: string; is_default: boolean }>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  t: (key: string) => string;
}

function AddressForm({ form, setForm, onSave, onCancel, saving, t }: AddressFormProps) {
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField fullWidth size="small" label={t('recipientName')} value={form.recipient_name} onChange={(e) => setForm((f) => ({ ...f, recipient_name: e.target.value }))} />
        <TextField fullWidth size="small" label={t('mobileNumber')} value={form.mobile_number} onChange={(e) => setForm((f) => ({ ...f, mobile_number: e.target.value }))} />
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField fullWidth size="small" label={t('city')} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
        <TextField fullWidth size="small" label={t('postalCode')} value={form.postal_code} onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))} />
      </Stack>
      <TextField fullWidth size="small" label={t('address')} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
      <FormControlLabel
        control={<Switch checked={form.is_default} onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))} size="small" />}
        label={<Typography variant="body2">{t('defaultAddress')}</Typography>}
      />
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="contained" onClick={onSave} disabled={saving} startIcon={saving ? <CircularProgress size={14} /> : null} sx={{ borderRadius: '8px' }}>
          {t('save')}
        </Button>
        <Button size="small" onClick={onCancel} sx={{ borderRadius: '8px' }}>{t('cancel')}</Button>
      </Stack>
    </Stack>
  );
}
