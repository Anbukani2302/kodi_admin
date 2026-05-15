# KODI Genealogy Platform - Admin Dashboard

A modern, fully-featured admin dashboard built with React 18, TypeScript, and Tailwind CSS. Features complete Tamil and English language support with a clean, professional interface.

## Features

### 🌐 Dual Language Support
- **English** and **Tamil (தமிழ்)** translation
- Language toggle in header and login page
- Complete translation coverage across all pages

### 🔐 Authentication
- Separate Admin and Staff login screens
- Role-based access control (Admin vs Staff)
- Form validation with 5 fields:
  - Name
  - Email (Gmail)
  - Phone Number
  - Password
  - Confirm Password

### 📊 Dashboard
- **Stat Cards**: Total Users, New Users, Active Users, System Health
- Recent activity feed
- System status monitoring
- Responsive grid layout

### 👥 Staff Management
- List view with search functionality
- Add/Edit/Delete staff members
- Activate/Deactivate staff accounts
- Complete CRUD operations with modal forms
- Mock data with Indian names

### 👤 User Management
- Advanced table with sorting and filtering
- Search functionality
- Status filters (Active, Inactive, Suspended)
- Bulk actions support
- Export functionality (UI only)
- Checkbox selection

### 🛡️ Permissions Management
- Permission template system
- Visual permission matrix (Read/Write/Delete)
- Module-level access control
- Template assignment interface
- Admin and Staff permission presets

### 📝 Activity Logs
- Comprehensive activity tracking
- Filter by action type (Login, Logout, Create, Update, Delete)
- Search across all log fields
- Export functionality
- IP address tracking
- Timestamp display

### 📈 Analytics
- User growth chart (Line chart)
- User distribution by role (Pie chart)
- Active users trend (Bar chart)
- Summary statistics cards
- Powered by Recharts library

### 👨‍💼 Profile Management
- Personal information editing
- Password change functionality
- User role display
- Profile avatar with initials

### ⚙️ System Settings
- General settings (System name, timezone, language, date format)
- Security settings (2FA, session timeout, password policy)
- System status monitoring
- Toggle switches for features

### 🎨 Design Features
- **Color Scheme**: 
  - Primary: Indigo (#6366f1)
  - Sidebar: Dark Gray (#1f2937)
  - Background: Light Gray (#f9fafb)
- **Typography**: Inter font family
- **Icons**: Lucide React icons
- Fully responsive (mobile, tablet, desktop)
- Smooth sidebar toggle animation
- Hover states and transitions
- Professional card-based layouts

### ♿ Accessibility
- Keyboard navigation support
- Focus visible states
- ARIA labels on interactive elements
- High contrast text
- Screen reader friendly
- Semantic HTML structure

## Demo Credentials

### Admin Login
- **Email**: admin@kodi.com
- **Password**: admin123

### Staff Login
- **Email**: staff@kodi.com
- **Password**: staff123

## Technology Stack

- **React 18** - UI Framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **React Router** - Navigation (Data mode)
- **Recharts** - Analytics charts
- **Lucide React** - Icons
- **Node v20.20.0** - Compatible
- **Vite** - Build tool

## Project Structure

```
/
├── App.tsx                          # Main app component
├── routes.ts                        # React Router configuration
├── context/
│   ├── AuthContext.tsx             # Authentication state management
│   └── LanguageContext.tsx         # Language/translation management
├── components/
│   ├── auth/
│   │   └── LoginPage.tsx           # Login screen with dual language
│   ├── layout/
│   │   ├── AdminLayout.tsx         # Main layout wrapper
│   │   ├── Sidebar.tsx             # Collapsible sidebar navigation
│   │   └── Header.tsx              # Top header with language toggle
│   ├── dashboard/
│   │   └── Dashboard.tsx           # Dashboard with stat cards
│   ├── staff/
│   │   └── StaffManagement.tsx     # Staff CRUD operations
│   ├── users/
│   │   └── UserManagement.tsx      # User management table
│   ├── permissions/
│   │   └── PermissionsManagement.tsx # Permissions system
│   ├── logs/
│   │   └── ActivityLogs.tsx        # Activity log viewer
│   ├── analytics/
│   │   └── Analytics.tsx           # Charts and analytics
│   ├── profile/
│   │   └── Profile.tsx             # User profile management
│   └── settings/
│       └── Settings.tsx            # System settings
└── styles/
    └── globals.css                 # Global styles and Inter font

## Role-Based Access

### Admin Access
- ✅ Dashboard
- ✅ Staff Management
- ✅ User Management
- ✅ Permissions Management
- ✅ Activity Logs
- ✅ Analytics
- ✅ Profile
- ✅ Settings

### Staff Access
- ✅ Dashboard
- ✅ User Management
- ✅ Activity Logs
- ✅ Profile

## Key Features Implementation

### Sidebar Toggle
- Smooth expand/collapse animation
- Persists state on desktop
- Auto-collapse on mobile
- Icon-only mode when collapsed
- Responsive overlay on mobile

### Language System
- Context-based translation system
- Over 100+ translation keys
- Real-time language switching
- Persists across all pages
- Dropdown and button toggle options

### Mock Data
- Indian names for realistic demo
- Comprehensive staff and user data
- Activity logs with timestamps
- Permission templates
- Analytics data points

## Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- All API calls are mocked with static data
- No backend integration required
- Export buttons show alerts (UI only)
- Form validations are client-side only
- Perfect for demonstration and prototyping

## Future Enhancements (Suggestions)

- Backend API integration
- Real-time notifications
- Advanced filtering and sorting
- Data export to CSV/Excel
- File upload functionality
- Multi-factor authentication
- Email notifications
- Advanced analytics with date ranges
- Dark mode support
- Additional language support

---

Built with ❤️ for KODI Genealogy Platform
```
