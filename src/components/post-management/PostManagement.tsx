// src/components/post-management/PostManagement.tsx
import React, { useState, useEffect } from "react";
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid as MuiGrid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Tooltip,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
  Stack,
  useTheme,
  useMediaQuery,
  Grid,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Block as BlockIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Search as SearchIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Pending as PendingIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Flag as FlagIcon,
  Restore as RestoreIcon,
  Comment as CommentIcon,
  Report as ReportIcon,
  Article as ArticleIcon,
  ThumbUp as ThumbUpIcon,
  Warning as WarningIcon,
  PendingActions as PendingActionsIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { PermissionDenied } from "../common/PermissionDenied";
import { PermissionGranted } from "../common/PermissionPage";
import { useLanguage } from "../../context/LanguageContext";

// Types matching Django backend
interface Post {
  id: number;
  author_mobile: string;
  content_preview?: string;
  content?: string;
  visibility: "public" | "friends" | "private" | "custom";
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_active: boolean;
  is_deleted: boolean;
  is_reported: boolean;
  created_at: string;
  updated_at: string;
  reports_count: number;
  media?: Array<{
    id: number;
    media_type: string;
    file_url: string;
    thumbnail_url?: string;
    caption?: string;
    original_filename?: string;
  }>;
  author?: {
    id: number;
    mobile_number: string;
    name: string;
    profile_image?: string;
  };
}

interface Comment {
  id: number;
  post_id: number;
  author_mobile: string;
  content: string;
  parent: number | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  replies_count?: number;
}

interface Report {
  id: number;
  post: number;
  post_content_preview: string;
  post_author_mobile: string;
  reported_by_mobile: string;
  reason: string;
  description: string;
  is_reviewed: boolean;
  is_action_taken: boolean;
  admin_notes: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

interface Stats {
  total_posts: number;
  active_posts: number;
  deleted_posts: number;
  reported_posts: number;
  total_comments: number;
  active_comments: number;
  total_reports: number;
  pending_reports: number;
  total_visibility_rules: number;
}

interface VisibilityRule {
  id: number;
  name: string;
  description: string;
  familyname8_criteria: string | null;
  lifestyle_criteria: string | null;
  family_name_criteria: string | null;
  area_criteria: string | null;
  is_active: boolean;
  created_by_mobile: string;
  eligible_users_count: number;
  created_at: string;
  updated_at: string;
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
      id={`post-tabpanel-${index}`}
      aria-labelledby={`post-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>{children}</Box>
      )}
    </div>
  );
}

export const PostManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const { t } = useLanguage();
  const { user, role } = useAuth();

  // Permission check for staff
  console.log('PostManagement Debug:', { role, permissions: user?.permissions });
  const hasPermission = role === "admin" ||
    user?.permissions?.can_manage_post ||
    user?.permissions?.post_management ||
    user?.permissions?.manage_post ||
    user?.permissions?.can_manage_posts ||
    user?.permissions?.posts_management ||
    user?.permissions?.post;
  console.log('PostManagement hasPermission:', hasPermission, 'role:', role, 'permissions:', user?.permissions);

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [rules, setRules] = useState<VisibilityRule[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string>('');

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [reportReviewOpen, setReportReviewOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<VisibilityRule | null>(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter]);

  const [reviewNotes, setReviewNotes] = useState("");

  const [ruleFormData, setRuleFormData] = useState({
    name: "",
    description: "",
    familyname8_criteria: "",
    lifestyle_criteria: "",
    family_name_criteria: "",
    area_criteria: "",
    is_active: true,
  });

  // Fetch functions matching Django API
  const fetchStats = async () => {
    try {
      console.log('PostManagement: Fetching stats...');
      const response = await api.get("/api/posts/admin/posts/stats/");
      console.log('PostManagement: Stats API response:', response.data);
      setStats(response.data);
      setError(''); // Clear any previous errors
    } catch (error: any) {
      console.error("Error fetching stats:", error);

      // Check for 403 Forbidden status
      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || 'You do not have permission to perform this action.';
        console.error('PostManagement: 403 Permission denied for stats:', errorMessage);
        setError(errorMessage);
        return;
      }
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      console.log('PostManagement: Fetching posts...');
      let url = "/api/posts/admin/posts/";
      const params: any = {};

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (statusFilter === "active") {
        params.status = "active";
      } else if (statusFilter === "deleted") {
        params.status = "deleted";
      } else if (statusFilter === "reported") {
        params.status = "reported";
      }

      params.page = page + 1;
      params.page_size = rowsPerPage;

      console.log('PostManagement: API call to:', url, 'with params:', params);
      const response = await api.get(url, { params });
      console.log('PostManagement: API response:', response.data);

      setPosts(response.data.results || response.data);
      setTotalCount(response.data.count || response.data.length);
      setError(''); // Clear any previous errors
    } catch (error: any) {
      console.error("Error fetching posts:", error);

      // Check for 403 Forbidden status
      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || 'You do not have permission to perform this action.';
        console.error('PostManagement: 403 Permission denied:', errorMessage);
        setError(errorMessage);
        return;
      }

      setSnackbar({
        open: true,
        message: "Failed to load posts",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/posts/admin/reports/");
      setReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setSnackbar({
        open: true,
        message: "Failed to load reports",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: number) => {
    try {
      const response = await api.get("/api/posts/admin/comments/", {
        params: { post_id: postId },
      });
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/posts/admin/visibility-rules/");
      setRules(response.data);
    } catch (error) {
      console.error("Error fetching rules:", error);
      setSnackbar({
        open: true,
        message: "Failed to load visibility rules",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    if (tabValue === 0) fetchPosts();
    if (tabValue === 1) fetchReports();
    if (tabValue === 2) fetchRules();
  }, [tabValue, page, rowsPerPage, statusFilter, searchTerm]);

  // Post Actions
  const handlePostAction = async (
    postId: number,
    action: "hide" | "unhide" | "soft_delete"
  ) => {
    try {
      await api.patch(`/api/posts/admin/posts/${postId}/`, { action });
      const actionMessages = {
        hide: "Post hidden successfully",
        unhide: "Post restored successfully",
        soft_delete: "Post soft-deleted successfully",
      };
      setSnackbar({
        open: true,
        message: actionMessages[action],
        severity: "success",
      });
      fetchPosts();
      fetchStats();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Operation failed",
        severity: "error",
      });
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    try {
      await api.delete(`/api/posts/admin/posts/${selectedPost.id}/`);
      setSnackbar({
        open: true,
        message: "Post permanently deleted",
        severity: "success",
      });
      fetchPosts();
      fetchStats();
      setDeleteDialogOpen(false);
      setViewDialogOpen(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to delete post",
        severity: "error",
      });
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this comment?"
      )
    )
      return;
    try {
      await api.delete(`/api/posts/admin/comments/${commentId}/delete/`);
      setSnackbar({
        open: true,
        message: "Comment deleted successfully",
        severity: "success",
      });
      if (selectedPost) fetchComments(selectedPost.id);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to delete comment",
        severity: "error",
      });
    }
  };

  const handleReviewReport = async (reportId: number, takeAction: boolean) => {
    try {
      await api.post(`/api/posts/admin/reports/${reportId}/review/`, {
        take_action: takeAction,
        admin_notes: reviewNotes,
      });
      setSnackbar({
        open: true,
        message: "Report reviewed successfully",
        severity: "success",
      });
      fetchReports();
      fetchStats();
      setReportReviewOpen(false);
      setReviewNotes("");
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to review report",
        severity: "error",
      });
    }
  };

  // Rule Management
  const handleSaveRule = async () => {
    try {
      if (editingRule) {
        await api.put(
          `/api/posts/admin/visibility-rules/${editingRule.id}/`,
          ruleFormData
        );
        setSnackbar({
          open: true,
          message: "Rule updated successfully",
          severity: "success",
        });
      } else {
        await api.post("/api/posts/admin/visibility-rules/", ruleFormData);
        setSnackbar({
          open: true,
          message: "Rule created successfully",
          severity: "success",
        });
      }
      fetchRules();
      setRuleDialogOpen(false);
      resetRuleForm();
    } catch (error: any) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        "Failed to save rule";
      setSnackbar({ open: true, message, severity: "error" });
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (
      !window.confirm("Are you sure you want to delete this visibility rule?")
    )
      return;
    try {
      await api.delete(`/api/posts/admin/visibility-rules/${ruleId}/`);
      setSnackbar({
        open: true,
        message: "Rule deleted successfully",
        severity: "success",
      });
      fetchRules();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to delete rule",
        severity: "error",
      });
    }
  };

  const resetRuleForm = () => {
    setRuleFormData({
      name: "",
      description: "",
      familyname8_criteria: "",
      lifestyle_criteria: "",
      family_name_criteria: "",
      area_criteria: "",
      is_active: true,
    });
    setEditingRule(null);
  };

  const openPostDetail = async (post: Post) => {
    try {
      const response = await api.get(`/api/posts/admin/posts/${post.id}/`);
      setSelectedPost(response.data);
      await fetchComments(post.id);
      setViewDialogOpen(true);
    } catch (error) {
      console.error("Error fetching post detail:", error);
      setSnackbar({
        open: true,
        message: "Failed to load post details",
        severity: "error",
      });
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "success";
      case "friends":
        return "info";
      case "private":
        return "error";
      case "custom":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusChip = (post: Post) => {
    if (post.is_deleted) {
      return (
        <Chip
          icon={<BlockIcon />}
          label="Deleted"
          sx={{
            bgcolor: '#fee2e2',
            color: '#991b1b',
            fontWeight: 'bold',
            '& .MuiChip-icon': { color: '#991b1b' }
          }}
          size="small"
        />
      );
    }
    if (!post.is_active) {
      return (
        <Chip
          icon={<HideIcon />}
          label="Hidden"
          sx={{
            bgcolor: '#fef3c7',
            color: '#92400e',
            fontWeight: 'bold',
            '& .MuiChip-icon': { color: '#92400e' }
          }}
          size="small"
        />
      );
    }
    if (post.is_reported) {
      return (
        <Chip
          icon={<ReportIcon />}
          label="Reported"
          sx={{
            bgcolor: '#ffedd5',
            color: '#9a3412',
            fontWeight: 'bold',
            '& .MuiChip-icon': { color: '#9a3412' }
          }}
          size="small"
        />
      );
    }
    return (
      <Chip
        icon={<ApprovedIcon />}
        label="Active"
        sx={{
          bgcolor: '#dcfce7',
          color: '#166534',
          fontWeight: 'bold',
          '& .MuiChip-icon': { color: '#166534' }
        }}
        size="small"
      />
    );
  };

  const StatCard = ({ title, value, icon: IconComponent, color }: any) => (
    <Card
      sx={{
        height: "100%",
        background: `linear-gradient(135deg, ${color}15, ${color}05)`,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography
              color="textSecondary"
              gutterBottom
              variant="caption"
              sx={{ fontWeight: 500 }}
            >
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            <IconComponent sx={{ fontSize: 28 }} />
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );


  if (error && (error.toLowerCase().includes('permission') || error.toLowerCase().includes('not have permission'))) {
    console.log('PostManagement: Showing PermissionDenied due to error:', error);
    return <PermissionDenied message={error} />;
  }

  if (!hasPermission) {
    console.log('PostManagement: Showing PermissionDenied - hasPermission:', hasPermission, 'role:', role, 'permissions:', user?.permissions);
    // Temporary bypass to test if API works without permission check
    // return (
    //   <PermissionDenied message={t('postManagement.permissionDenied') || 'You do not have permission to access Post Management. Please contact your administrator.'} />
    // );
    console.log('PostManagement: Bypassing permission check for testing');
  }

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 2, md: 3 },
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      {/* Statistics Dashboard */}
      {stats && (
        <MuiGrid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
          <MuiGrid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Posts"
              value={stats.total_posts}
              icon={ArticleIcon}
              color="#1976d2"
            />
          </MuiGrid>
          <MuiGrid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Active Posts"
              value={stats.active_posts}
              icon={ApprovedIcon}
              color="#2e7d32"
            />
          </MuiGrid>
          <MuiGrid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Reported Posts"
              value={stats.reported_posts}
              icon={WarningIcon}
              color="#ed6c02"
            />
          </MuiGrid>
          <MuiGrid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Pending Reports"
              value={stats.pending_reports}
              icon={PendingActionsIcon}
              color="#9c27b0"
            />
          </MuiGrid>
        </MuiGrid>
      )}

      {/* Main Content */}
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <Box
          sx={{ p: { xs: 1, sm: 2 }, borderBottom: 1, borderColor: "divider" }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              mb: 2,
              gap: 2,
            }}
          >
            <Typography
              variant="h5"
              component="h2"
              sx={{
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
                fontWeight: "bold",
              }}
            >
              {t('PostManagement') || 'Post Management'}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                if (tabValue === 0) fetchPosts();
                if (tabValue === 1) fetchReports();
                if (tabValue === 2) fetchRules();
                fetchStats();
              }}
              size={isMobile ? "small" : "medium"}
            >
              Refresh
            </Button>
          </Box>

          {tabValue === 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                mb: 2,
              }}
            >
              <TextField
                placeholder="Search posts by author or content..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && fetchPosts()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1 }}
              />
              <FormControl
                size="small"
                sx={{ minWidth: { xs: "100%", sm: 150 } }}
              >
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Posts</MenuItem>
                  <MenuItem value="active">Active Only</MenuItem>
                  <MenuItem value="deleted">Deleted Only</MenuItem>
                  <MenuItem value="reported">Reported Only</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained" sx={{ bgcolor: '#b71c1c', '&:hover': { bgcolor: '#b71c1cd9' } }}
                onClick={fetchPosts}
                fullWidth={isMobile}
              >
                Apply Filter
              </Button>
            </Box>
          )}

          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Posts" />
            <Tab label={`Reports (${stats?.pending_reports || 0})`} />
          </Tabs>
        </Box>

        {/* Posts Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer
            sx={{
              overflowX: "hidden",
              maxWidth: "100%",
            }}
          >
            <Table
              size={isMobile ? "small" : "medium"}
              sx={{
                width: "100%",
                tableLayout: "auto",
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Content</TableCell>
                  <TableCell>Visibility</TableCell>
                  {!isMobile && (
                    <TableCell>Stats</TableCell>
                  )}
                  <TableCell>Status</TableCell>
                  {!isMobile && (
                    <TableCell>Created</TableCell>
                  )}
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 6 : 8} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 6 : 8} align="center">
                      <Typography color="textSecondary">
                        No posts found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => (
                    <TableRow
                      key={post.id}
                      sx={{ "&:hover": { bgcolor: "action.hover" } }}
                    >
                      <TableCell>{post.id}</TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{ width: 30, height: 30, bgcolor: "#1976d2" }}
                          >
                            {post.author_mobile?.[0]?.toUpperCase() || "U"}
                          </Avatar>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              wordBreak: "break-word",
                            }}
                          >
                            {isMobile
                              ? post.author_mobile?.slice(-6)
                              : post.author_mobile}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            color: "text.primary"
                          }}
                        >
                          {post.content_preview || "(No content)"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={post.visibility}
                          color={getVisibilityColor(post.visibility)}
                          size="small"
                        />
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            flexWrap="wrap"
                            gap={0.5}
                          >
                            <Tooltip title="Likes">
                              <Chip
                                size="small"
                                label={`❤️ ${post.likes_count}`}
                                variant="outlined"
                              />
                            </Tooltip>
                            <Tooltip title="Comments">
                              <Chip
                                size="small"
                                label={`💬 ${post.comments_count}`}
                                variant="outlined"
                              />
                            </Tooltip>
                            {post.reports_count > 0 && (
                              <Tooltip title="Reports">
                                <Chip
                                  size="small"
                                  label={`⚠️ ${post.reports_count}`}
                                  color="warning"
                                  variant="outlined"
                                />
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      )}
                      <TableCell>{getStatusChip(post)}</TableCell>
                      {!isMobile && (
                        <TableCell>
                          {format(new Date(post.created_at), "dd/MM/yy HH:mm")}
                        </TableCell>
                      )}
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => openPostDetail(post)}
                            >
                              <ViewIcon
                                fontSize={isMobile ? "small" : "medium"}
                              />
                            </IconButton>
                          </Tooltip>
                          {!post.is_deleted && (
                            <>
                              {post.is_active ? (
                                <Tooltip title="Hide Post">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handlePostAction(post.id, "hide")
                                    }
                                  >
                                    <HideIcon
                                      fontSize={isMobile ? "small" : "medium"}
                                    />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Unhide Post">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handlePostAction(post.id, "unhide")
                                    }
                                  >
                                    <RestoreIcon
                                      fontSize={isMobile ? "small" : "medium"}
                                    />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          )}
                          <Tooltip title="Permanent Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedPost(post);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <DeleteIcon
                                fontSize={isMobile ? "small" : "medium"}
                              />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={isMobile ? [5, 10] : [5, 10, 25]}
              component="div"
              count={totalCount}
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

        {/* Reports Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer
            sx={{
              overflowX: "hidden",
              maxWidth: "100%",
            }}
          >
            <Table
              size={isMobile ? "small" : "medium"}
              sx={{
                width: "100%",
                tableLayout: "fixed",
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "8%" }}>ID</TableCell>
                  <TableCell sx={{ width: "30%" }}>Post Content</TableCell>
                  <TableCell sx={{ width: "15%" }}>Post Author</TableCell>
                  {!isMobile && (
                    <TableCell sx={{ width: "15%" }}>Reported By</TableCell>
                  )}
                  <TableCell sx={{ width: "12%" }}>Reason</TableCell>
                  <TableCell sx={{ width: "12%" }}>Status</TableCell>
                  {!isMobile && (
                    <TableCell sx={{ width: "13%" }}>Created</TableCell>
                  )}
                  <TableCell sx={{ width: "15%" }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 6 : 8} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 6 : 8} align="center">
                      <Typography color="textSecondary">
                        No reports found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.id}</TableCell>
                      <TableCell>
                        <Tooltip
                          title={
                            <Box sx={{ maxWidth: 400, p: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                }}
                              >
                                {report.post_content_preview}
                              </Typography>
                            </Box>
                          }
                          arrow
                          placement="top-start"
                          enterDelay={500}
                          leaveDelay={200}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              cursor: "pointer",
                              wordBreak: "break-word",
                              "&:hover": {
                                color: "#1976d2",
                                textDecoration: "underline",
                              },
                            }}
                          >
                            {report.post_content_preview}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{report.post_author_mobile}</TableCell>
                      {!isMobile && (
                        <TableCell>{report.reported_by_mobile}</TableCell>
                      )}
                      <TableCell>
                        <Chip label={report.reason} size="small" />
                      </TableCell>
                      <TableCell>
                        {report.is_reviewed ? (
                          <Chip
                            label="Reviewed"
                            sx={{
                              bgcolor: '#dcfce7',
                              color: '#166534',
                              fontWeight: 'bold',
                              minWidth: '85px'
                            }}
                            size="small"
                          />
                        ) : (
                          <Chip
                            label="Pending"
                            sx={{
                              bgcolor: '#ffedd5',
                              color: '#9a3412',
                              fontWeight: 'bold',
                              minWidth: '85px'
                            }}
                            size="small"
                          />
                        )}
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          {format(
                            new Date(report.created_at),
                            "dd/MM/yy HH:mm"
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Stack spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              textTransform: 'none',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                              minWidth: 'fit-content'
                            }}
                            onClick={async () => {
                              try {
                                const response = await api.get(`/api/posts/admin/posts/${report.post}/`);
                                setSelectedPost(response.data);
                                await fetchComments(report.post);
                                setViewDialogOpen(true);
                              } catch (error) {
                                console.error("Error fetching post detail:", error);
                                setSnackbar({
                                  open: true,
                                  message: "Failed to load post details",
                                  severity: "error",
                                });
                              }
                            }}
                            fullWidth
                          >
                            {t('ViewDetails') || 'View Details'}
                          </Button>
                          {!report.is_reviewed && (
                            <Button
                              size="small"
                              variant="contained"
                              sx={{
                                bgcolor: '#b71c1c',
                                '&:hover': { bgcolor: '#b71c1cd9' },
                                textTransform: 'none',
                                fontWeight: 'bold'
                              }}
                              onClick={() => {
                                setSelectedReport(report);
                                setReportReviewOpen(true);
                              }}
                              fullWidth
                            >
                              Review
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Permanently Delete Post</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete this post? This action
            cannot be undone.
            {selectedPost?.is_deleted && (
              <Typography color="warning.main" sx={{ mt: 1 }}>
                Note: This post is already soft-deleted. Permanent deletion will
                remove it completely.
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeletePost} color="error" variant="contained" sx={{ bgcolor: '#b71c1c', '&:hover': { bgcolor: '#b71c1cd9' } }}>
            Permanently Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Post Dialog with Comments */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedPost && (
          <>
            <DialogTitle>
              Post Details - ID: {selectedPost.id}
              <IconButton
                sx={{ position: "absolute", right: 8, top: 8 }}
                onClick={() => setViewDialogOpen(false)}
              >
                ✕
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Typography
                variant="body1"
                sx={{ mb: 2, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              >
                {selectedPost.content || "(No content)"}
              </Typography>

              {selectedPost.media && selectedPost.media.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                    Media Attachments:
                  </Typography>
                  <MuiGrid container spacing={1}>
                    {selectedPost.media.map((media) => (
                      <MuiGrid size={{ xs: 12, sm: 6 }} key={media.id}>
                        <Card variant="outlined" sx={{ overflow: "hidden" }}>
                          {media.media_type === "image" ? (
                            <Box sx={{ position: "relative", pt: "75%", backgroundColor: "#000" }}>
                              <img
                                src={media.file_url}
                                alt={media.caption || "Post media"}
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = media.thumbnail_url || "";
                                }}
                              />
                            </Box>
                          ) : (
                            <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "action.hover" }}>
                              <Typography variant="body2" color="textSecondary">
                                {media.media_type.toUpperCase()} File
                              </Typography>
                            </Box>
                          )}
                          {(media.caption || media.original_filename) && (
                            <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                              <Typography variant="caption" display="block" noWrap>
                                {media.caption || media.original_filename}
                              </Typography>
                            </CardContent>
                          )}
                        </Card>
                      </MuiGrid>
                    ))}
                  </MuiGrid>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Comments ({comments.length})
              </Typography>

              {comments.length === 0 ? (
                <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                  No comments on this post
                </Typography>
              ) : (
                comments.map((comment) => (
                  <Paper
                    key={comment.id}
                    sx={{ p: 1.5, mb: 1, bgcolor: "#f5f5f5" }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      flexWrap="wrap"
                      gap={1}
                    >
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          {comment.author_mobile} •{" "}
                          {format(
                            new Date(comment.created_at),
                            "dd/MM/yy HH:mm"
                          )}
                          {comment.is_edited && <span> (edited)</span>}
                        </Typography>
                        {comment.parent && (
                          <Chip
                            label="Reply"
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1, height: 20 }}
                          />
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.5, wordBreak: "break-word" }}
                    >
                      {comment.content}
                    </Typography>
                  </Paper>
                ))
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, flexWrap: "wrap", gap: 1 }}>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Report Review Dialog */}
      <Dialog
        open={reportReviewOpen}
        onClose={() => setReportReviewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Review Report</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle2">Post Content:</Typography>
              <Paper sx={{ p: 1.5, mb: 2, bgcolor: "#f5f5f5" }}>
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {selectedReport.post_content_preview}
                </Typography>
              </Paper>

              <Typography variant="subtitle2">Report Reason:</Typography>
              <Paper sx={{ p: 1.5, mb: 2, bgcolor: "#f5f5f5" }}>
                <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                  <strong>{selectedReport.reason}</strong>
                  {selectedReport.description && (
                    <>
                      <br />
                      {selectedReport.description}
                    </>
                  )}
                </Typography>
              </Paper>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Admin Notes"
                variant="outlined"
                margin="normal"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about this report..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, flexWrap: "wrap", gap: 1 }}>
          <Button onClick={() => setReportReviewOpen(false)}>Cancel</Button>
          <Button
            color="warning"
            onClick={() => handleReviewReport(selectedReport!.id, false)}
          >
            Dismiss Report
          </Button>
          <Button
            color="error"
            variant="contained" sx={{ bgcolor: '#b71c1c', '&:hover': { bgcolor: '#b71c1cd9' } }}
            onClick={() => handleReviewReport(selectedReport!.id, true)}
          >
            Hide Post & Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PostManagement;
