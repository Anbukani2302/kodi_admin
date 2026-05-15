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
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Chip,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  Tab,
  Tabs,
  Avatar,
  Tooltip,
  Card,
  CardContent,
  Grid as Grid2,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Block as BlockIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Message as MessageIcon,
  RemoveCircle as RemoveIcon,
  VolumeOff as MuteIcon,
  AdminPanelSettings as AdminIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  AttachFile as AttachFileIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  Flag as FlagIcon,
  Comment as CommentIcon,
  Visibility as VisibilityIcon,
  Report as ReportIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import api from '../../services/api';
import { useAuth } from "../../context/AuthContext";
import { PermissionDenied } from "../common/PermissionDenied";
import { useLanguage } from "../../context/LanguageContext";

interface ChatRoom {
  id: number;
  room_type: 'direct' | 'group';
  name: string | null;
  members: Array<{ id: number; mobile_number: string; profile_name?: string }>;
  last_message: {
    content: string;
    sender_mobile: string;
    created_at: string;
  } | null;
  unread_count: number;
  created_at: string;
}

interface Message {
  id: number;
  content: string;
  sender_id: number;
  sender_mobile: string;
  created_at: string;
  is_deleted: boolean;
  attachments: Array<{
    id: number;
    filename: string;
    file_url: string;
  }>;
}

interface User {
  id: number;
  mobile_number: string;
  profile_name: string;
  profile_image: string | null;
  total_messages: number;
  total_rooms: number;
  last_message_at: string | null;
  last_active_in_chat: string | null;
  blocked_by_count: number;
  has_blocked_count: number;
  first_name?: string;  // Added optional property
  last_name?: string;   // Added optional property
}

interface BlockedUser {
  id: number;
  blocked_id: number;
  blocked_mobile: string;
  created_at: string;
}

interface Stats {
  users: {
    total_active: number;
    new_today: number;
    new_last_7_days: number;
  };
  chat_rooms: {
    total: number;
    direct: number;
    group: number;
  };
  messages: {
    total: number;
    today: number;
    last_7_days: number;
  };
  attachments: {
    total: number;
    today: number;
  };
  top_5_active_rooms: Array<{
    id: number;
    name: string | null;
    room_type: string;
    msg_count: number;
  }>;
  top_5_active_users: Array<{
    id: number;
    mobile_number: string;
    msg_count: number;
  }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`chat-tabpanel-${index}`}
      aria-labelledby={`chat-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>{children}</Box>}
    </div>
  );
}

export const ChatManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const { t } = useLanguage();
  const { user, role } = useAuth();

  // Permission check for staff
  console.log('ChatManagement Debug:', { role, permissions: user?.permissions });
  const hasPermission = role === "admin" ||
    user?.permissions?.can_manage_chat ||
    user?.permissions?.chat_management ||
    user?.permissions?.manage_chat ||
    user?.permissions?.can_manage_chats ||
    user?.permissions?.chats_management ||
    user?.permissions?.chat;
  console.log('ChatManagement hasPermission:', hasPermission, 'role:', role, 'permissions:', user?.permissions);

  // Temporary bypass for debugging
  const bypassPermission = false;

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [removeUserDialogOpen, setRemoveUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ChatRoom | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [searchTerm, setSearchTerm] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalRooms, setTotalRooms] = useState(0);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/chat/admin/stats/');
      console.log('Stats response:', response.data);
      setStats(response.data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);

      // Check for 403 Forbidden status
      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || 'You do not have permission to perform this action.';
        setError(errorMessage);
        return;
      }

      setSnackbar({ open: true, message: 'Failed to load statistics', severity: 'error' });
    }
  };

  const fetchRooms = async (pageToFetch: number = page, size: number = rowsPerPage) => {
    setLoading(true);
    try {
      const response = await api.get('/api/chat/admin/rooms/', {
        params: {
          page: pageToFetch + 1,
          page_size: size,
          search: searchTerm
        }
      });

      const data = response.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setRooms(data.results || []);
        setTotalRooms(data.count || 0);
      } else {
        setRooms(Array.isArray(data) ? data : []);
        setTotalRooms(Array.isArray(data) ? data.length : 0);
      }
    } catch (error: any) {
      console.error('Error fetching rooms:', error);

      // Check for 403 Forbidden status
      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || 'You do not have permission to perform this action.';
        setError(errorMessage);
        return;
      }

      setSnackbar({ open: true, message: 'Failed to load chat rooms', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (pageToFetch: number = page, size: number = rowsPerPage) => {
    setLoading(true);
    try {
      const response = await api.get('/api/chat/admin/users/', {
        params: {
          page: pageToFetch + 1,
          page_size: size,
          search: searchTerm
        }
      });

      const data = response.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setUsers(data.results || []);
        setTotalUsers(data.count || 0);
      } else {
        setUsers(Array.isArray(data) ? data : []);
        setTotalUsers(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setSnackbar({ open: true, message: 'Failed to load users', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/chat/admin/blocked/');
      setBlockedUsers(response.data);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setPage(0);
      if (tabValue === 0) fetchRooms(0);
      if (tabValue === 1) fetchUsers(0);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(0);
    if (tabValue === 0) fetchRooms(0);
    if (tabValue === 1) fetchUsers(0);
    if (tabValue === 2) fetchBlockedUsers();
  }, [tabValue, rowsPerPage]);

  useEffect(() => {
    if (tabValue === 0) fetchRooms();
    if (tabValue === 1) fetchUsers();
  }, [page]);

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    try {
      await api.delete(`/api/chat/admin/messages/${selectedMessage.id}/delete/`);
      setSnackbar({ open: true, message: 'Message deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      if (selectedRoom) {
        // Refresh room messages
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete message', severity: 'error' });
    }
  };

  const handleRemoveFromGroup = async () => {
    if (!selectedGroup || !selectedUser) return;
    try {
      await api.post(`/api/chat/admin/groups/${selectedGroup.id}/remove/${selectedUser.id}/`, {});
      setSnackbar({ open: true, message: `User removed from group`, severity: 'success' });
      setRemoveUserDialogOpen(false);
      fetchRooms();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to remove user', severity: 'error' });
    }
  };

  const handleBlockUser = async (userId: number, block: boolean) => {
    try {
      if (block) {
        await api.post('/api/chat/admin/accounts/block/',
          { user_id: userId }
        );
      } else {
        await api.post(`/api/chat/admin/accounts/unblock/${userId}/`, {});
      }
      setSnackbar({ open: true, message: `User ${block ? 'blocked' : 'unblocked'} successfully`, severity: 'success' });
      fetchUsers();
      fetchBlockedUsers();
    } catch (error) {
      setSnackbar({ open: true, message: 'Operation failed', severity: 'error' });
    }
  };

  const getRoomIcon = (roomType: string) => {
    return roomType === 'group' ? <GroupIcon /> : <PersonIcon />;
  };

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <Card sx={{
      height: '100%',
      background: `linear-gradient(135deg, ${color}20, ${color}10)`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[4]
      }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
          <Box sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
          {value?.toLocaleString() || 0}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="textSecondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );


  if (error && (error.toLowerCase().includes('permission') || error.toLowerCase().includes('not have permission'))) {
    console.log('ChatManagement: Showing PermissionDenied due to error:', error);
    return <PermissionDenied message={error} />;
  }

  if (!hasPermission && !bypassPermission) {
    // Permission check for UI display
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Stats Dashboard */}
      <>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1a1a1a' }}>
          Chat Statistics
        </Typography>
        <Grid2 container spacing={isMobile ? 1 : 2} sx={{ mb: 3, maxWidth: '100%', mx: 'auto' }}>
          {/* Users Stats */}
          <Grid2 size={{ xs: 6, sm: 6, md: 3 }}>
            <StatCard
              title="Active Users"
              value={stats?.users?.total_active}
              icon={<PeopleIcon sx={{ color: '#d32f2f' }} />}
              color="#d32f2f"
              subtitle={stats?.users?.new_today ? `+${stats.users.new_today} today` : ''}
            />
          </Grid2>
          <Grid2 size={{ xs: 6, sm: 6, md: 3 }}>
            <StatCard
              title="New Users (7d)"
              value={stats?.users?.new_last_7_days}
              icon={<TrendingUpIcon sx={{ color: '#c62828' }} />}
              color="#c62828"
            />
          </Grid2>

          {/* Chat Rooms Stats */}
          <Grid2 size={{ xs: 6, sm: 6, md: 3 }}>
            <StatCard
              title="Chat Rooms"
              value={stats?.chat_rooms?.total}
              icon={<ChatIcon sx={{ color: '#b71c1c' }} />}
              color="#b71c1c"
              subtitle={stats?.chat_rooms ? `${stats.chat_rooms.direct} Direct · ${stats.chat_rooms.group} Groups` : ''}
            />
          </Grid2>
          <Grid2 size={{ xs: 6, sm: 6, md: 3 }}>
            <StatCard
              title="Total Messages"
              value={stats?.messages?.total}
              icon={<MessageIcon sx={{ color: '#9a0007' }} />}
              color="#9a0007"
              subtitle={stats?.messages?.today ? `+${stats.messages.today} today` : ''}
            />
          </Grid2>

          {/* Attachments Stats */}
          <Grid2 size={{ xs: 6, sm: 6, md: 3 }}>
            <StatCard
              title="Attachments"
              value={stats?.attachments?.total}
              icon={<AttachFileIcon sx={{ color: '#f44336' }} />}
              color="#f44336"
              subtitle={stats?.attachments?.today ? `+${stats.attachments.today} today` : ''}
            />
          </Grid2>
          <Grid2 size={{ xs: 6, sm: 6, md: 3 }}>
            <StatCard
              title="Messages (7d)"
              value={stats?.messages?.last_7_days}
              icon={<DateRangeIcon sx={{ color: '#00bcd4' }} />}
              color="#00bcd4"
            />
          </Grid2>
        </Grid2>
      </>

      {/* Top Active Rooms & Users */}
      <Grid2 container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: { xs: 1, sm: 2 }, height: '100%', }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
              <GroupIcon sx={{ color: '#d32f2f' }} /> Top 5 Active Rooms
            </Typography>
            <List>
              {stats?.top_5_active_rooms?.map((room, index) => (
                <React.Fragment key={room.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `hsl(${index * 72}, 70%, 50%)` }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={room.name || `Room ${room.id}`}
                      secondary={`Type: ${room.room_type}`}
                    />
                    <Chip
                      label={`${room.msg_count} msgs`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: { xs: 1, sm: 2 }, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
              <PeopleIcon sx={{ color: '#c62828' }} /> Top 5 Active Users
            </Typography>
            <List>
              {stats?.top_5_active_users?.map((user, index) => (
                <React.Fragment key={user.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `hsl(${index * 72}, 70%, 50%)` }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.mobile_number}
                      secondary={`User ID: ${user.id}`}
                    />
                    <Chip
                      label={`${user.msg_count} msgs`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid2>
      </Grid2>

      {/* Main Management Section */}
      <Paper sx={{ p: { xs: 1, sm: 2 }, mb: 2, overflow: 'hidden' }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 2,
          gap: 2
        }}>
          <Typography variant="h5" component="h2" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Chat Management System
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchStats();
              if (tabValue === 0) fetchRooms();
              if (tabValue === 1) fetchUsers();
              if (tabValue === 2) fetchBlockedUsers();
            }}
            size={isMobile ? 'small' : 'medium'}
          >
            {t('chatManagement.refresh') || 'Refresh'}
          </Button>
        </Box>

        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Chat Rooms" />
          <Tab label="Users" />
          <Tab label="Blocked Users" />
        </Tabs>
      </Paper>

      {/* Chat Rooms Tab */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: { xs: 1, sm: 2 }, maxHeight: '70vh', overflow: 'auto' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <TablePagination
            rowsPerPageOptions={isMobile ? [5, 10] : [5, 10, 25]}
            component="div"
            count={totalRooms}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{ mb: 2 }}
          />
          <List>
            {rooms
              ?.map((room) => (
                <ListItem
                  key={room.id}
                  sx={{
                    mb: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 1, sm: 0 }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      {getRoomIcon(room.room_type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={room.room_type === 'group' ? room.name : room.members[0]?.mobile_number}
                    secondary={
                      <Typography variant="caption" component="span">
                        {room.last_message?.content?.substring(0, 30)}...
                      </Typography>
                    }
                    sx={{ flex: 1 }}
                  />
                  {room.unread_count > 0 && (
                    <Badge badgeContent={room.unread_count} color="error" />
                  )}
                </ListItem>
              ))
            }
          </List>
        </Paper>
      </TabPanel>

      {/* Users Tab */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#b71c1c', color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ bgcolor: '#b71c1c', color: 'white', fontWeight: 'bold' }}>Mobile</TableCell>
                <TableCell sx={{ bgcolor: '#b71c1c', color: 'white', fontWeight: 'bold' }}>Profile Name</TableCell>
                <TableCell sx={{ bgcolor: '#b71c1c', color: 'white', fontWeight: 'bold' }}>Total Messages</TableCell>
                <TableCell sx={{ bgcolor: '#b71c1c', color: 'white', fontWeight: 'bold' }}>Total Rooms</TableCell>
                {!isMobile && <TableCell sx={{ bgcolor: '#b71c1c', color: 'white', fontWeight: 'bold' }}>Last Message</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  sx={{
                    '&:hover': {
                      bgcolor: '#d32f2f10' // Light red background on hover
                    },
                    '&:last-child td, &:last-child th': {
                      border: 0
                    }
                  }}
                >
                  <TableCell sx={{ '&:hover': { bgcolor: '#d32f2f20' } }}>{user.id}</TableCell>
                  <TableCell sx={{ '&:hover': { bgcolor: '#d32f2f20' } }}>{user.mobile_number}</TableCell>
                  <TableCell>{user.profile_name}</TableCell>
                  <TableCell>{user.total_messages}</TableCell>
                  <TableCell>{user.total_rooms}</TableCell>
                  {!isMobile && <TableCell>{user.last_message_at ? format(new Date(user.last_message_at), 'dd/MM/yyyy HH:mm') : '-'}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={isMobile ? [5, 10] : [5, 10, 25]}
            component="div"
            count={totalUsers}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>
      </TabPanel>

      {/* Blocked Users Tab */}
      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Blocked User</TableCell>
                {!isMobile && <TableCell>Blocked At</TableCell>}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {blockedUsers.map((blocked) => (
                <TableRow key={blocked.id}>
                  <TableCell>{blocked.id}</TableCell>
                  <TableCell>{blocked.blocked_mobile}</TableCell>
                  {!isMobile && <TableCell>{blocked.created_at ? format(new Date(blocked.created_at), 'dd/MM/yyyy HH:mm') : '-'}</TableCell>}
                  <TableCell>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleBlockUser(blocked.blocked_id, false)}
                    >
                      Unblock
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Delete Message Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Message</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete this message?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteMessage} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Remove User from Group Dialog */}
      <Dialog open={removeUserDialogOpen} onClose={() => setRemoveUserDialogOpen(false)}>
        <DialogTitle>Remove User from Group</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a user to remove from {selectedGroup?.name}:
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select User</InputLabel>
            <Select
              value={selectedUser?.id || ''}
              onChange={(e) => setSelectedUser(users.find(u => u.id === e.target.value) || null)}
              label="Select User"
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.mobile_number} - {user.first_name || ''} {user.last_name || ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRemoveFromGroup} color="error" variant="contained">Remove</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatManagement;