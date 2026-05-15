import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  SelectChangeEvent,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Typography,
  Tooltip,
  Grid,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { staffService, Staff, CreateStaffRequest } from '../../services/staffService';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface StaffManagementProps {
  // Add any props if needed
}

// Define response types
interface PaginatedResponse {
  results?: Staff[];
  count?: number;
  data?: Staff[];
  total?: number;
  staff?: Staff[];
}

interface SingleStaffResponse extends Staff {
  message?: string;
}

export const StaffManagement: React.FC<StaffManagementProps> = () => {
  const theme = useTheme();
  const { t } = useLanguage();

  // State
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [apiConnected, setApiConnected] = useState<boolean>(true);
  const [staffStats, setStaffStats] = useState<{ total: number; active: number; inactive: number } | null>(null);

  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openToggleDialog, setOpenToggleDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [toggleAction, setToggleAction] = useState<'activate' | 'deactivate'>('deactivate');

  // Form states
  const [newStaff, setNewStaff] = useState<CreateStaffRequest>({
    full_name: '',
    mobile_number: '',
    email: '',
    password: '',
  });

  const [editStaff, setEditStaff] = useState<Partial<Staff & { password?: string }>>({
    full_name: '',
    mobile_number: '',
    email: '',
    password: '',
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{
    full_name?: string;
    mobile_number?: string;
    email?: string;
    password?: string;
  }>({});

  // Snackbar states
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Fetch staff list using staffService
  const fetchStaffList = async () => {
    try {
      setLoading(true);
      console.log('Fetching staff list with params:', { searchTerm, statusFilter });

      // Fetch both staff list and dashboard stats
      const [listResponse, dashboardResponse] = await Promise.allSettled([
        staffService.getAllStaff(searchTerm, statusFilter, page + 1, rowsPerPage),
        api.get('api/admin/dashboard/')
      ]);

      if (dashboardResponse.status === 'fulfilled') {
        const dData = dashboardResponse.value.data;
        if (dData?.breakdown?.staff) {
          setStaffStats(dData.breakdown.staff);
        }
      }

      if (listResponse.status === 'rejected') {
        throw listResponse.reason;
      }

      const data = listResponse.value as Staff[] | PaginatedResponse;
      console.log('Fetched staff data:', data);

      // Handle different response structures
      let staffArray: Staff[] = [];

      if (Array.isArray(data)) {
        // Direct array response
        staffArray = data;
        setTotalCount(data.length);
      } else if (data && typeof data === 'object') {
        // Check if data has results property (paginated response)
        const responseData = data as PaginatedResponse;

        if ('results' in responseData && Array.isArray(responseData.results)) {
          staffArray = responseData.results;
          setTotalCount(responseData.count || responseData.results.length);
        }
        // Check if data has data property
        else if ('data' in responseData && Array.isArray(responseData.data)) {
          staffArray = responseData.data;
          setTotalCount(responseData.total || responseData.data.length);
        }
        // Check if it's a single staff object
        else if ('id' in responseData) {
          staffArray = [responseData as Staff];
          setTotalCount(1);
        }
        // If it's an object with staff property
        else if ('staff' in responseData && Array.isArray(responseData.staff)) {
          staffArray = responseData.staff;
          setTotalCount(responseData.staff.length);
        }
      }

      setStaffList(staffArray);
      setApiConnected(true);

    } catch (error: any) {
      console.error('Error in fetchStaffList:', error);

      // Check if it's a network error
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        setApiConnected(false);
        showSnackbar('Cannot connect to server. Please check your connection.', 'error');
      } else {
        showSnackbar(
          error.response?.data?.message || error.message || t('staff.errorFetching'),
          'error'
        );
      }

      setStaffList([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = (data: Partial<CreateStaffRequest>, isEdit: boolean = false): boolean => {
    const errors: typeof formErrors = {};

    if (!data.full_name?.trim()) {
      errors.full_name = 'Full name is required';
    }

    if (!data.mobile_number?.trim()) {
      errors.mobile_number = 'Mobile number is required';
    } else if (!/^\d+$/.test(data.mobile_number)) {
      errors.mobile_number = 'Mobile number must contain only digits';
    } else if (data.mobile_number.length !== 10) {
      errors.mobile_number = 'Mobile number must be exactly 10 digits';
    }

    if (!data.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!isEdit && !data.password) {
      errors.password = 'Password is required';
    } else if (data.password && data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create new staff
  const handleCreateStaff = async () => {
    if (!validateForm(newStaff, false)) {
      return;
    }

    try {
      setLoading(true);
      const response = await staffService.createStaff(newStaff);

      // Check for success from the staffService response
      if (response.success || response.staff || (response as any).id) {
        showSnackbar(response.message || t('staff.createdSuccessfully'), 'success');
        setOpenCreateDialog(false);
        setNewStaff({
          full_name: '',
          mobile_number: '',
          email: '',
          password: '',
        });
        setFormErrors({});
        fetchStaffList();
      } else {
        throw new Error(response.message || 'Failed to create staff');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || t('staff.failedToCreate');
      showSnackbar(errorMessage, 'error');
      console.error('Error creating staff:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single staff for edit
  const handleEditClick = async (staff: Staff) => {
    try {
      setLoading(true);
      // Try to fetch fresh data, fallback to provided staff object
      let staffData = staff;
      try {
        staffData = await staffService.getStaffById(staff.id) as Staff;
      } catch (fetchError) {
        console.warn('Could not fetch fresh staff data, using provided data:', fetchError);
      }

      setSelectedStaff(staffData);
      setEditStaff({
        full_name: staffData.full_name || staffData.name,
        mobile_number: staffData.mobile_number,
        email: staffData.email,
        password: '', // Empty password field for new entry
      });
      setFormErrors({});
      setOpenEditDialog(true);
    } catch (error) {
      showSnackbar('Failed to fetch staff details', 'error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update staff
  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;

    if (!validateForm(editStaff, true)) {
      return;
    }

    try {
      setLoading(true);
      // Prepare update data
      const updateData: any = {
        full_name: editStaff.full_name,
        mobile_number: editStaff.mobile_number,
        email: editStaff.email,
      };

      // Only include password if it's provided
      if (editStaff.password && editStaff.password.trim() !== '') {
        updateData.password = editStaff.password;
      }

      const response = await staffService.updateStaff(selectedStaff.id, updateData) as unknown as SingleStaffResponse;

      showSnackbar(response.message || 'Staff updated successfully', 'success');
      setOpenEditDialog(false);
      setSelectedStaff(null);
      setEditStaff({});
      setFormErrors({});
      fetchStaffList();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update staff';
      showSnackbar(errorMessage, 'error');
      console.error('Error updating staff:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete staff
  const handleDeleteClick = (staff: Staff) => {
    setSelectedStaff(staff);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedStaff) return;

    try {
      setLoading(true);
      const response = await staffService.deleteStaff(selectedStaff.id);

      showSnackbar(response.message || 'Staff deleted successfully', 'success');
      setOpenDeleteDialog(false);
      setSelectedStaff(null);
      fetchStaffList();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete staff';
      showSnackbar(errorMessage, 'error');
      console.error('Error deleting staff:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle staff active status
  const handleToggleStatus = async () => {
    if (!selectedStaff) return;

    try {
      setLoading(true);
      const response = await staffService.toggleStaffStatus(selectedStaff.id) as unknown as SingleStaffResponse;

      // Update the local state immediately for better UX
      setStaffList(prevList =>
        prevList.map(staff =>
          staff.id === selectedStaff.id
            ? { ...staff, staff_is_active: !staff.staff_is_active }
            : staff
        )
      );

      showSnackbar(
        response.message || `${selectedStaff.staff_is_active ? t('staff.deactivatedSuccessfully') : t('staff.activatedSuccessfully')}`,
        'success'
      );
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || t('staff.errorToggling'), 'error');
      console.error('Error toggling staff status:', error);
    } finally {
      setOpenToggleDialog(false);
      setSelectedStaff(null);
      setToggleAction('deactivate');
      setLoading(false);
    }
  };

  // Show toast notification
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    if (severity === 'success') {
      toast.success(message);
    } else if (severity === 'error') {
      toast.error(message);
    } else {
      toast(message);
    }
  };

  // Test API connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      const isConnected = await staffService.testConnection();
      setApiConnected(isConnected);
      if (!isConnected) {
        showSnackbar('Cannot connect to server. Please check your connection.', 'error');
      } else {
        fetchStaffList();
      }
    };
    testConnection();
  }, []);

  // Effects for filtering and pagination
  useEffect(() => {
    if (apiConnected) {
      fetchStaffList();
    }
  }, [statusFilter, page, rowsPerPage]);

  // Search with debounce
  useEffect(() => {
    if (!apiConnected) return;

    const timer = setTimeout(() => {
      setPage(0); // Reset to first page on search
      fetchStaffList();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreateDialogOpen = () => {
    setOpenCreateDialog(true);
  };

  const handleCreateDialogClose = () => {
    setOpenCreateDialog(false);
    setNewStaff({
      full_name: '',
      mobile_number: '',
      email: '',
      password: '',
    });
    setFormErrors({});
  };

  const handleEditDialogClose = () => {
    setOpenEditDialog(false);
    setSelectedStaff(null);
    setEditStaff({});
    setFormErrors({});
  };

  const handleDeleteDialogClose = () => {
    setOpenDeleteDialog(false);
    setSelectedStaff(null);
  };

  const handleToggleDialogOpen = (staff: Staff) => {
    setSelectedStaff(staff);
    setToggleAction(staff.staff_is_active ? 'deactivate' : 'activate');
    setOpenToggleDialog(true);
  };

  const handleToggleDialogClose = () => {
    setOpenToggleDialog(false);
    setSelectedStaff(null);
    setToggleAction('deactivate');
  };

  const handleNewStaffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStaff(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleEditStaffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditStaff(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return t('staff.never');
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Custom styles for professional look matching logo (Red)
  const redColor = '#d32f2f'; // MUI red[700]

  const paginatedStaff = staffList;

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#FDFDFD',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Premium Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          pointerEvents: 'none',
          backgroundImage: 'radial-gradient(#DC2626 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px',
          zIndex: 0,
        }}
      />
      <Box sx={{ position: 'absolute', top: '-10%', left: '-5%', width: 400, height: 400, background: 'rgba(220, 38, 38, 0.05)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 400, height: 400, background: 'rgba(0, 0, 0, 0.03)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 4
        }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.5px', fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            {t('staff.title')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateDialogOpen}
            disabled={!apiConnected}
            sx={{
              minWidth: 160,
              height: 48,
              borderRadius: '12px',
              bgcolor: redColor,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.95rem',
              boxShadow: '0 8px 16px rgba(211, 47, 47, 0.24)',
              '&:hover': {
                bgcolor: '#b71c1c',
                boxShadow: '0 12px 20px rgba(211, 47, 47, 0.32)',
                transform: 'translateY(-1px)',
              },
              '&:disabled': {
                bgcolor: '#ccc',
                boxShadow: 'none',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {t('staff.createStaff')}
          </Button>
        </Box>

        {/* Connection Alert */}
        {!apiConnected && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: '12px' }}
            action={
              <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          >
            Cannot connect to server. Please check your connection and try again.
          </Alert>
        )}

        {/* Staff Statistics Cards */}
        {staffStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' }}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Staff
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: '#1a1a1a' }}>
                  {staffStats.total}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', background: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#276749', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Active Staff
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: '#22543d' }}>
                  {staffStats.active}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', background: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#9b2c2c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Inactive Staff
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: '#742a2a' }}>
                  {staffStats.inactive}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder={t('Search by name or email')}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                disabled={!apiConnected}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    bgcolor: '#fff',
                  }
                }}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ mr: 1, color: redColor }} />,
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ '&.Mui-focused': { color: redColor } }}>{t('staff.status')}</InputLabel>
                <Select
                  value={statusFilter}
                  label={t('staff.status')}
                  onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
                  disabled={!apiConnected}
                  sx={{
                    borderRadius: '14px',
                    bgcolor: '#fff',
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: redColor,
                    },
                  }}
                >
                  <MenuItem value="all">{t('staff.allStatus')}</MenuItem>
                  <MenuItem value="active">{t('staff.active')}</MenuItem>
                  <MenuItem value="inactive">{t('staff.inactive')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchStaffList}
                disabled={!apiConnected || loading}
                sx={{
                  height: '56px',
                  borderRadius: '14px',
                  color: redColor,
                  borderColor: redColor,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#b71c1c',
                    bgcolor: 'rgba(211, 47, 47, 0.04)',
                    borderWidth: 1,
                  }
                }}
              >
                {t('staff.refresh')}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Staff Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.04)', background: 'rgba(255, 255, 255, 0.95)' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {[t('staff.id'), t('staff.name'), t('staff.mobileNumber'), t('staff.email'), t('staff.status'), t('staff.createdAt')].map((head) => (
                    <TableCell key={head} sx={{
                      fontWeight: 700,
                      backgroundColor: '#f8f9fa',
                      color: '#495057',
                      py: 2.5,
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {head}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{
                    fontWeight: 700,
                    backgroundColor: '#f8f9fa',
                    color: '#495057',
                    py: 2.5,
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {t('staff.actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                      <CircularProgress size={40} sx={{ color: redColor }} />
                    </TableCell>
                  </TableRow>
                ) : !apiConnected ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                      <Typography color="error" sx={{ fontWeight: 500 }}>
                        Cannot connect to server
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : staffList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                      <Typography color="textSecondary" sx={{ fontWeight: 500 }}>
                        {t('staff.noStaffFound')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStaff.map((staff) => (
                    <TableRow
                      key={staff.id}
                      hover
                      sx={{
                        '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.02) !important' },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>#{staff.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{staff.name || staff.full_name}</TableCell>
                      <TableCell>{staff.mobile_number}</TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={staff.staff_is_active ? t('staff.active') : t('staff.inactive')}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            backgroundColor: staff.staff_is_active
                              ? 'rgba(46, 125, 50, 0.12)'
                              : 'rgba(211, 47, 47, 0.12)',
                            color: staff.staff_is_active
                              ? '#2e7d32'
                              : '#d32f2f',
                            border: `1px solid ${staff.staff_is_active ? 'rgba(46, 125, 50, 0.2)' : 'rgba(211, 47, 47, 0.2)'}`,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
                          {formatDate(staff.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          {/* Edit Button */}
                          <Tooltip title="Edit Staff" arrow>
                            <IconButton
                              onClick={() => handleEditClick(staff)}
                              size="medium"
                              sx={{
                                transition: 'all 0.2s',
                                color: '#1976d2',
                                '&:hover': {
                                  transform: 'scale(1.15)',
                                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                                }
                              }}
                            >
                              <EditIcon sx={{ fontSize: 22 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Delete Button */}
                          <Tooltip title="Delete Staff" arrow>
                            <IconButton
                              onClick={() => handleDeleteClick(staff)}
                              size="medium"
                              sx={{
                                transition: 'all 0.2s',
                                color: '#d32f2f',
                                '&:hover': {
                                  transform: 'scale(1.15)',
                                  bgcolor: 'rgba(211, 47, 47, 0.08)',
                                }
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 22 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Toggle Status Button */}
                          <Tooltip
                            title={staff.staff_is_active ? t('staff.deactivateStaff') : t('staff.activateStaff')}
                            arrow
                          >
                            <IconButton
                              onClick={() => handleToggleDialogOpen(staff)}
                              size="medium"
                              sx={{
                                transition: 'all 0.2s',
                                '&:hover': {
                                  transform: 'scale(1.15)',
                                  bgcolor: staff.staff_is_active
                                    ? 'rgba(211, 47, 47, 0.08)'
                                    : 'rgba(46, 125, 50, 0.08)',
                                }
                              }}
                            >
                              {staff.staff_is_active ? (
                                <CheckCircleIcon
                                  sx={{
                                    fontSize: 22,
                                    color: '#2e7d32'
                                  }}
                                />
                              ) : (
                                <CancelIcon
                                  sx={{
                                    fontSize: 22,
                                    color: '#d32f2f'
                                  }}
                                />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
          />
        </Paper>

        {/* Create Staff Dialog */}
        <Dialog
          open={openCreateDialog}
          onClose={handleCreateDialogClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: '24px', p: 1 }
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: '#1a1a1a', borderBottom: '1px solid rgba(0,0,0,0.05)', pb: 2, px: 3 }}>
            {t('staff.createNewStaff')}
          </DialogTitle>
          <DialogContent sx={{ px: 3, pt: 3 }}>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label={t('staff.fullName')}
                name="full_name"
                value={newStaff.full_name}
                onChange={handleNewStaffChange}
                margin="normal"
                // No validation
                error={!!formErrors.full_name}
                helperText={formErrors.full_name}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
              />
              <TextField
                fullWidth
                label={t('staff.mobileNumber')}
                name="mobile_number"
                value={newStaff.mobile_number}
                onChange={handleNewStaffChange}
                margin="normal"
                inputProps={{ maxLength: 10 }}
                type="text"
                error={!!formErrors.mobile_number}
                helperText={formErrors.mobile_number}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
              />
              <TextField
                fullWidth
                label={t('staff.email')}
                name="email"
                value={newStaff.email}
                onChange={handleNewStaffChange}
                margin="normal"
                // No validation
                type="email"
                error={!!formErrors.email}
                helperText={formErrors.email}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
              />
              <TextField
                fullWidth
                label={t('staff.password')}
                name="password"
                value={newStaff.password}
                onChange={handleNewStaffChange}
                margin="normal"
                // No validation
                type="password"
                error={!!formErrors.password}
                helperText={formErrors.password}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
            <Button onClick={handleCreateDialogClose} sx={{ fontWeight: 600, color: '#666', textTransform: 'none' }}>{t('staff.cancel')}</Button>
            <Button
              onClick={handleCreateStaff}
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: redColor,
                borderRadius: '12px',
                px: 4,
                py: 1,
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { bgcolor: '#b71c1c' },
                '&:disabled': { bgcolor: '#ccc' }
              }}
            >
              {loading ? <CircularProgress size={24} /> : t('staff.createStaff')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Staff Dialog */}
        <Dialog
          open={openEditDialog}
          onClose={handleEditDialogClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: '24px', p: 1 }
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: '#1a1a1a', borderBottom: '1px solid rgba(0,0,0,0.05)', pb: 2, px: 3 }}>
            Edit Staff
          </DialogTitle>
          <DialogContent sx={{ px: 3, pt: 3 }}>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label={t('staff.fullName')}
                name="full_name"
                value={editStaff.full_name || ''}
                onChange={handleEditStaffChange}
                margin="normal"
                // No validation
                error={!!formErrors.full_name}
                helperText={formErrors.full_name}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
              />
              <TextField
                fullWidth
                label={t('staff.mobileNumber')}
                name="mobile_number"
                value={editStaff.mobile_number || ''}
                onChange={handleEditStaffChange}
                margin="normal"
                // No validation
                type="text"
                error={!!formErrors.mobile_number}
                helperText={formErrors.mobile_number}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
              />
              <TextField
                fullWidth
                label={t('staff.email')}
                name="email"
                value={editStaff.email || ''}
                onChange={handleEditStaffChange}
                margin="normal"
                // No validation
                type="email"
                error={!!formErrors.email}
                helperText={formErrors.email}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
              />
              <TextField
                fullWidth
                label={`${t('staff.password')} (Leave blank to keep current)`}
                name="password"
                value={editStaff.password || ''}
                onChange={handleEditStaffChange}
                margin="normal"
                type="password"
                placeholder="Enter new password"
                helperText={formErrors.password || "Only fill this if you want to change the password"}
                error={!!formErrors.password}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
            <Button onClick={handleEditDialogClose} sx={{ fontWeight: 600, color: '#666', textTransform: 'none' }}>{t('staff.cancel')}</Button>
            <Button
              onClick={handleUpdateStaff}
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: redColor,
                borderRadius: '12px',
                px: 4,
                py: 1,
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { bgcolor: '#b71c1c' },
                '&:disabled': { bgcolor: '#ccc' }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Update Staff'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={handleDeleteDialogClose}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: { borderRadius: '24px' }
          }}
        >
          <DialogTitle sx={{
            fontWeight: 800,
            px: 3,
            pt: 3,
            color: '#d32f2f'
          }}>
            Delete Staff
          </DialogTitle>
          <DialogContent sx={{ px: 3 }}>
            {selectedStaff && (
              <Box>
                <Typography variant="body1" sx={{ color: '#444', mb: 2 }}>
                  Are you sure you want to delete this staff member?
                </Typography>
                <Box sx={{
                  p: 2.5,
                  bgcolor: '#f8f9fa',
                  borderRadius: '16px',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}>
                  <Typography variant="subtitle2" sx={{ color: '#888', mb: 1, textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700 }}>
                    Staff Details
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>{t('staff.name')}:</strong> {selectedStaff.name || selectedStaff.full_name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>{t('staff.mobileNumber')}:</strong> {selectedStaff.mobile_number}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>{t('staff.email')}:</strong> {selectedStaff.email}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#d32f2f', mt: 2, fontWeight: 500 }}>
                  This action cannot be undone.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 4, pt: 2 }}>
            <Button
              onClick={handleDeleteDialogClose}
              variant="outlined"
              fullWidth
              sx={{ borderRadius: '12px', fontWeight: 600, py: 1.2, textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
              fullWidth
              disabled={loading}
              sx={{
                ml: 2,
                borderRadius: '12px',
                fontWeight: 700,
                py: 1.2,
                textTransform: 'none',
                boxShadow: '0 6px 16px rgba(211, 47, 47, 0.2)'
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toggle Status Confirmation Dialog */}
        <Dialog
          open={openToggleDialog}
          onClose={handleToggleDialogClose}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: { borderRadius: '24px' }
          }}
        >
          <DialogTitle sx={{
            fontWeight: 800,
            px: 3,
            pt: 3,
            color: toggleAction === 'deactivate'
              ? theme.palette.error.main
              : theme.palette.success.main
          }}>
            {toggleAction === 'deactivate' ? t('staff.deactivateStaff') : t('staff.activateStaff')}
          </DialogTitle>
          <DialogContent sx={{ px: 3 }}>
            {selectedStaff && (
              <Box>
                <Typography variant="body1" sx={{ color: '#444', mb: 2 }}>
                  {t('staff.areYouSure')} {toggleAction} {t('staff.staffMember')}?
                </Typography>
                <Box sx={{
                  p: 2.5,
                  bgcolor: '#f8f9fa',
                  borderRadius: '16px',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}>
                  <Typography variant="subtitle2" sx={{ color: '#888', mb: 1, textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700 }}>
                    {t('staff.staffDetails')}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>{t('staff.name')}:</strong> {selectedStaff.name || selectedStaff.full_name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>{t('staff.mobileNumber')}:</strong> {selectedStaff.mobile_number}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>{t('staff.email')}:</strong> {selectedStaff.email}
                  </Typography>
                  <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>{t('staff.currentStatus')}:</Typography>
                    <Chip
                      label={selectedStaff.staff_is_active ? t('staff.active') : t('staff.inactive')}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        backgroundColor: selectedStaff.staff_is_active ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                        color: selectedStaff.staff_is_active ? '#2e7d32' : '#d32f2f',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 4, pt: 2 }}>
            <Button
              onClick={handleToggleDialogClose}
              variant="outlined"
              fullWidth
              sx={{ borderRadius: '12px', fontWeight: 600, py: 1.2, textTransform: 'none' }}
            >
              {t('staff.cancel')}
            </Button>
            <Button
              onClick={handleToggleStatus}
              variant="contained"
              color={toggleAction === 'deactivate' ? "error" : "success"}
              fullWidth
              disabled={loading}
              sx={{
                ml: 2,
                borderRadius: '12px',
                fontWeight: 700,
                py: 1.2,
                textTransform: 'none',
                boxShadow: toggleAction === 'deactivate'
                  ? '0 6px 16px rgba(211, 47, 47, 0.2)'
                  : '0 6px 16px rgba(46, 125, 50, 0.2)'
              }}
            >
              {loading ? <CircularProgress size={24} /> : (toggleAction === 'deactivate' ? t('staff.deactivate') : t('staff.activate'))}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};