import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "./components/auth/LoginPage";
import { AdminLayout } from "./components/layout/AdminLayout";
import { Dashboard } from "./components/dashboard/Dashboard";
import { StaffManagement } from "./components/staff/StaffManagement";
import { UserManagement } from "./components/users/UserManagement";
import { PermissionsManagement } from "./components/permissions/PermissionsManagement";
import { ActivityLogs } from "./components/logs/ActivityLogs";
import { Analytics } from "./components/analytics/Analytics";
import { Profile } from "./components/profile/Profile";
import { Settings } from "./components/settings/Settings";
import { FamilyManagement } from "./family/RelationManagement";
import { EventManagement } from "./components/event-management/EventManagement";
import { ChatManagement } from "./components/chat-management/ChatManagement";
import { PostManagement } from "./components/post-management/PostManagement";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "staff",
        element: <StaffManagement />,
      },
      {
        path: "users",
        element: <UserManagement />,
      },
      {
        path: "permissions",
        element: <PermissionsManagement />,
      },
      {
        path: "logs",
        element: <ActivityLogs />,
      },
      {
        path: "analytics",
        element: <Analytics />,
      },
      {
        path: "family",
        element: <FamilyManagement />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "event-management",
        element: <EventManagement />,
      },
      {
        path: "chat-management",
        element: <ChatManagement />,
      },
      {
        path: "post-management",
        element: <PostManagement />,
      },
    ],
  },
]);
