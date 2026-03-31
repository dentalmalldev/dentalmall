'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Search,
  Edit,
  Block,
  CheckCircle,
  Delete,
  Download,
  Person,
  Store,
  LocalHospital,
  AdminPanelSettings,
  AccountBalance,
  Warehouse,
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers';
import { User, Role } from '@/types/models';
import { UserEditModal } from './user-edit-modal';

interface UserWithCount extends User {
  _count: { orders: number };
}

interface StatsData {
  total: number;
  active: number;
  vendors: number;
  clinics: number;
}

interface UsersResponse {
  data: UserWithCount[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  stats: StatsData;
}

const ROLE_CONFIG: Record<Role, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'; icon: React.ReactNode }> = {
  USER: { label: 'USER', color: 'default', icon: <Person sx={{ fontSize: 14 }} /> },
  VENDOR: { label: 'VENDOR', color: 'primary', icon: <Store sx={{ fontSize: 14 }} /> },
  CLINIC: { label: 'CLINIC', color: 'secondary', icon: <LocalHospital sx={{ fontSize: 14 }} /> },
  ADMIN: { label: 'ADMIN', color: 'error', icon: <AdminPanelSettings sx={{ fontSize: 14 }} /> },
  ACCOUNTANT: { label: 'ACCOUNTANT', color: 'warning', icon: <AccountBalance sx={{ fontSize: 14 }} /> },
  STORAGE: { label: 'STORAGE', color: 'success', icon: <Warehouse sx={{ fontSize: 14 }} /> },
};

export function UsersManagement() {
  const t = useTranslations('admin');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithCount[]>([]);
  const [stats, setStats] = useState<StatsData>({ total: 0, active: 0, vendors: 0, clinics: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(50);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit modal (full)
  const [editUserId, setEditUserId] = useState<string | null>(null);

  // Delete confirmation
  const [deleteUser, setDeleteUser] = useState<UserWithCount | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
        search,
        role: roleFilter,
        status: statusFilter,
        provider: providerFilter,
        ...(dateRange ? { dateRange } : {}),
      });

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch users');
      const data: UsersResponse = await res.json();
      setUsers(data.data);
      setTotal(data.total);
      setStats(data.stats);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [user, page, rowsPerPage, search, roleFilter, statusFilter, providerFilter, dateRange]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (u: UserWithCount) => {
    if (!user) return;
    setActionLoading(u.id);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      if (!res.ok) throw new Error();
      setSuccess(u.is_active ? t('userDisabled') : t('userEnabled'));
      fetchUsers();
    } catch {
      setError(t('actionFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteUser) return;
    setActionLoading(deleteUser.id);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/users/${deleteUser.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setSuccess(t('userDeleted'));
      setDeleteUser(null);
      fetchUsers();
    } catch {
      setError(t('actionFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Personal ID', 'Role', 'Status', 'Auth Provider', 'Orders', 'Registered'];
    const rows = users.map((u) => [
      `${u.first_name} ${u.last_name}`,
      u.email,
      u.personal_id || '',
      u.role,
      u.is_active ? 'Active' : 'Inactive',
      u.auth_provider,
      u._count.orders,
      new Date(u.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ka-GE', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          {t('usersManagement')}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleExportCSV}
          sx={{ borderRadius: '8px' }}
        >
          {t('exportCsv')}
        </Button>
      </Stack>

      {/* Stats Cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        {[
          { label: t('totalUsers'), value: stats.total, color: '#5B6ECD' },
          { label: t('activeUsers'), value: stats.active, color: '#4caf50' },
          { label: t('vendors'), value: stats.vendors, color: '#2196f3' },
          { label: t('clinics'), value: stats.clinics, color: '#9c27b0' },
        ].map((card) => (
          <Paper
            key={card.label}
            elevation={0}
            sx={{ flex: 1, p: 2.5, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {card.label}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: card.color }}>
              {card.value.toLocaleString()}
            </Typography>
          </Paper>
        ))}
      </Stack>

      {/* Alerts */}
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
          <TextField
            size="small"
            placeholder={t('searchUsers')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
            sx={{ minWidth: 240 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>{t('role')}</InputLabel>
            <Select value={roleFilter} label={t('role')} onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}>
              <MenuItem value="ALL">{t('allRoles')}</MenuItem>
              <MenuItem value="USER">USER</MenuItem>
              <MenuItem value="VENDOR">VENDOR</MenuItem>
              <MenuItem value="CLINIC">CLINIC</MenuItem>
              <MenuItem value="ACCOUNTANT">ACCOUNTANT</MenuItem>
              <MenuItem value="ADMIN">ADMIN</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>{t('status')}</InputLabel>
            <Select value={statusFilter} label={t('status')} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <MenuItem value="ALL">{t('allStatuses')}</MenuItem>
              <MenuItem value="ACTIVE">{t('active')}</MenuItem>
              <MenuItem value="INACTIVE">{t('inactive')}</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t('authProvider')}</InputLabel>
            <Select value={providerFilter} label={t('authProvider')} onChange={(e) => { setProviderFilter(e.target.value); setPage(0); }}>
              <MenuItem value="ALL">{t('allProviders')}</MenuItem>
              <MenuItem value="EMAIL">Email</MenuItem>
              <MenuItem value="GOOGLE">Google</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('dateRange')}</InputLabel>
            <Select value={dateRange} label={t('dateRange')} onChange={(e) => { setDateRange(e.target.value); setPage(0); }}>
              <MenuItem value="">{t('allTime')}</MenuItem>
              <MenuItem value="7">{t('last7Days')}</MenuItem>
              <MenuItem value="30">{t('last30Days')}</MenuItem>
              <MenuItem value="90">{t('last90Days')}</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f6fa' }}>
                  <TableCell sx={{ fontWeight: 600 }}>{t('fullName')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('emailLabel')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('personalId')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('role')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('status')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('registrationDate')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      {t('noUsers')}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => {
                    const roleConf = ROLE_CONFIG[u.role];
                    const isActing = actionLoading === u.id;
                    return (
                      <TableRow key={u.id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
                              {u.first_name[0]?.toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight={500}>
                              {u.first_name} {u.last_name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{u.email}</Typography>
                          <Typography variant="caption" color="text.secondary">{u.auth_provider}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {u.personal_id || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={roleConf.icon as React.ReactElement}
                            label={roleConf.label}
                            color={roleConf.color}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.is_active ? t('active') : t('inactive')}
                            color={u.is_active ? 'success' : 'default'}
                            size="small"
                            variant={u.is_active ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(u.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title={t('editUser')}>
                              <IconButton size="small" onClick={() => setEditUserId(u.id)} disabled={isActing}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={u.is_active ? t('disable') : t('enable')}>
                              <IconButton size="small" onClick={() => handleToggleActive(u)} disabled={isActing} color={u.is_active ? 'warning' : 'success'}>
                                {isActing ? <CircularProgress size={16} /> : u.is_active ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('delete')}>
                              <IconButton size="small" color="error" onClick={() => setDeleteUser(u)} disabled={isActing}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[50]}
            onPageChange={(_e, newPage) => setPage(newPage)}
          />
        </Paper>
      )}

      {/* Full Edit Modal */}
      <UserEditModal
        userId={editUserId}
        onClose={() => setEditUserId(null)}
        onUpdated={fetchUsers}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteUser} onClose={() => setDeleteUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle color="error">{t('confirmDeleteUser')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('deleteUserWarning', { name: `${deleteUser?.first_name} ${deleteUser?.last_name}` })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUser(null)}>{t('cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={!!actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} /> : null}
          >
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
