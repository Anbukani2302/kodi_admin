import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { User, Lock, Mail, Phone, Briefcase, Camera, Save, KeyRound, LogOut } from 'lucide-react';
import api from '../../services/api';
import { staffProfileService, StaffProfile, UpdateStaffProfileData } from '../../services/staffProfileService';

interface AdminProfile {
  full_name: string;
  mobile_number: string;
  email: string;
  admin_id: string;
  phone: string;
  department: string;
  designation: string;
  profile_picture: string;
  user_type: 'admin' | 'staff';
  is_active: boolean;
  created_at: string;
  last_login: string;
}

interface UpdateProfileData {
  full_name?: string;
  mobile_number?: string;
  email?: string;
  profile_picture?: File;
}

export function Profile() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [profileData, setProfileData] = useState<UpdateProfileData>({
    full_name: '',
    mobile_number: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    old_password: '', // for staff
    new_password: '',
    confirm_password: '',
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [userType, setUserType] = useState<'admin' | 'staff'>('admin');

  // Fetch profile data based on user type
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);

        // Check user type from auth context or API
        if (user?.user_type === 'staff') {
          setUserType('staff');
          const response = await staffProfileService.getProfile();
          setStaffProfile(response);
        } else {
          setUserType('admin');
          const response = await api.get('/api/admin/profile/');
          setAdminProfile(response.data);
        }
      } catch (error: any) {
        console.error('Failed to fetch profile:', error);
        setErrorMessage('Failed to load profile data');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Update profileData when profile changes
  useEffect(() => {
    if (userType === 'staff' && staffProfile) {
      setProfileData({
        full_name: staffProfile.full_name || '',
        mobile_number: staffProfile.mobile_number || '',
        email: staffProfile.email || '',
      });
      if (staffProfile.profile_picture) {
        setImagePreview(staffProfile.profile_picture);
      }
    } else if (userType === 'admin' && adminProfile) {
      setProfileData({
        full_name: adminProfile.full_name || '',
        mobile_number: adminProfile.mobile_number || '',
        email: adminProfile.email || '',
      });
      if (adminProfile.profile_picture) {
        setImagePreview(adminProfile.profile_picture);
      }
    }
  }, [adminProfile, staffProfile, userType]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (userType === 'staff') {
        // Staff profile update
        const updateData: UpdateProfileData = {};

        if (profileData.full_name !== staffProfile?.full_name) {
          updateData.full_name = profileData.full_name;
        }
        if (profileData.mobile_number !== staffProfile?.mobile_number) {
          updateData.mobile_number = profileData.mobile_number;
        }
        if (profileData.email !== staffProfile?.email) {
          updateData.email = profileData.email;
        }
        if (profileImage) {
          updateData.profile_picture = profileImage;
        }

        if (Object.keys(updateData).length > 0) {
          const response = await staffProfileService.updateProfile(updateData);
          setSuccessMessage(response.message || 'Profile updated successfully!');
          // Refresh profile
          const refreshedProfile = await staffProfileService.getProfile();
          setStaffProfile(refreshedProfile);
        } else {
          setSuccessMessage('No changes to save');
        }
      } else {
        // Admin profile update
        const formData = new FormData();

        Object.keys(profileData).forEach(key => {
          const value = profileData[key as keyof UpdateProfileData];
          if (value !== undefined && value !== null && value !== '') {
            formData.append(key, value.toString());
          }
        });

        if (profileImage) {
          formData.append('profile_picture', profileImage);
        }

        const response = await api.put('/api/admin/profile/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setSuccessMessage(response.data.message || 'Profile updated successfully!');
        // Refresh profile
        const refreshedProfile = await api.get('/api/admin/profile/');
        setAdminProfile(refreshedProfile.data);
      }

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (error: any) {
      console.error('Profile update error:', error);
      setErrorMessage(
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userType === 'staff') {
      // Staff password validation
      if (passwordData.new_password !== passwordData.confirm_password) {
        setErrorMessage('New passwords do not match!');
        return;
      }

      if (passwordData.new_password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long');
        return;
      }

      if (!passwordData.old_password) {
        setErrorMessage('Current password is required');
        return;
      }
    } else {
      // Admin password validation
      if (passwordData.new_password !== passwordData.confirm_password) {
        setErrorMessage('New passwords do not match!');
        return;
      }

      if (passwordData.new_password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long');
        return;
      }
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (userType === 'staff') {
        // Staff password change
        const response = await staffProfileService.changePassword({
          old_password: passwordData.old_password,
          new_password: passwordData.new_password,
          confirm_password: passwordData.confirm_password
        });

        setSuccessMessage(response.message || 'Password updated successfully!');

        setPasswordData({
          current_password: '',
          old_password: '',
          new_password: '',
          confirm_password: '',
        });
      } else {
        // Admin password change
        const response = await api.post('/api/admin/change-password/', {
          old_password: passwordData.current_password,
          new_password: passwordData.new_password,
          confirm_password: passwordData.confirm_password,
        });

        setSuccessMessage(response.data.message || 'Password updated successfully!');

        setPasswordData({
          current_password: '',
          old_password: '',
          new_password: '',
          confirm_password: '',
        });
      }

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (error: any) {
      console.error('Password change error:', error);
      setErrorMessage(
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.response?.data?.old_password?.[0] ||
        'Failed to change password. Please check your current password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please upload an image file');
        return;
      }

      setProfileImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileDataChange = (field: keyof UpdateProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };


  const isStaff = userType === 'staff';
  const profile = isStaff ? staffProfile : adminProfile;
  const buttonColor = isStaff ? 'red' : 'indigo';
  const textColor = isStaff ? 'red' : 'indigo';
  const bgGradient = isStaff
    ? 'bg-gradient-to-br from-red-100 to-orange-100'
    : 'bg-gradient-to-br from-red-100 to-purple-100';

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Success/Error Messages */}
      {(successMessage || errorMessage) && (
        <div className={`p-4 rounded-lg ${successMessage ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm font-medium ${successMessage ? 'text-green-800' : 'text-red-800'}`}>
            {successMessage || errorMessage}
          </p>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isStaff
              ? (t('Staff Profile') || 'Staff Profile Settings')
              : (t('profile.title') || 'Profile Settings')
            }
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'profile'
              ? `border-${buttonColor}-500 text-${buttonColor}-600`
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <User className="w-4 h-4" />
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'password'
              ? `border-${buttonColor}-500 text-${buttonColor}-600`
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <KeyRound className="w-4 h-4" />
            Change Password
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <div className="flex flex-col items-center">
              {/* Profile Image */}
              <div className="relative mb-4">
                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg ${bgGradient}`}>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className={`text-4xl text-${buttonColor}-600 font-bold`}>
                        {profile?.full_name?.charAt(0).toUpperCase() || (isStaff ? 'S' : 'A')}
                      </span>
                    </div>
                  )}
                </div>
                <label className={`absolute bottom-2 right-2 bg-${buttonColor}-600 text-white p-2 rounded-full cursor-pointer hover:bg-${buttonColor}-700 transition-colors shadow-lg`}>
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {profile?.full_name || (isStaff ? 'Staff User' : 'Admin User')}
              </h2>
              <p className={`text-sm text-gray-500 capitalize mb-2 px-3 py-1 bg-${buttonColor}-50 rounded-full`}>
                {profile?.user_type || (isStaff ? 'staff' : 'admin')}
              </p>

              <div className="w-full space-y-3 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-900 font-medium ml-auto truncate">
                    {profile?.email || (isStaff ? 'staff@example.com' : 'admin@example.com')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{isStaff ? 'Mobile:' : 'Phone:'}</span>
                  <span className="text-gray-900 font-medium ml-auto">
                    {isStaff
                      ? (staffProfile?.mobile_number || '+91 00000 00000')
                      : (adminProfile?.mobile_number || adminProfile?.phone || '+91 00000 00000')
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{isStaff ? 'Staff ID:' : 'Admin ID:'}</span>
                  <span className="text-gray-900 font-medium ml-auto">
                    {isStaff
                      ? (staffProfile?.admin_id || 'STAFF001')
                      : (adminProfile?.admin_id || 'ADM001')
                    }
                  </span>
                </div>
                {profile?.created_at && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Member since {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'profile' ? (
            /* Profile Information Form */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className={`w-5 h-5 text-${buttonColor}-600`} />
                <h2 className="text-lg font-semibold text-gray-900">
                  {isStaff
                    ? (t('staffProfile.personalInfo') || 'Personal Information')
                    : (t('profile.personalInfo') || 'Personal Information')
                  }
                </h2>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name - Editable for both */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('Full Name') || 'Full Name'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={profileData.full_name || ''}
                      onChange={(e) => handleProfileDataChange('full_name', e.target.value)}
                      className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${buttonColor}-500 focus:border-transparent transition-all`}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  {/* Email - Editable for both */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('Email ID') || 'Email Address'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={profileData.email || ''}
                      onChange={(e) => handleProfileDataChange('email', e.target.value)}
                      className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${buttonColor}-500 focus:border-transparent transition-all`}
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  {isStaff ? (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('Mobile Number') || 'Mobile Number'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={profileData.mobile_number || ''}
                        onChange={(e) => handleProfileDataChange('mobile_number', e.target.value)}
                        className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${buttonColor}-500 focus:border-transparent transition-all`}
                        placeholder="Enter mobile number"
                        required
                      />
                    </div>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('Mobile Number') || 'Mobile Number'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={profileData.mobile_number || adminProfile?.mobile_number || adminProfile?.phone || ''}
                        onChange={(e) => handleProfileDataChange('mobile_number', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Enter mobile number"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Update your mobile number here
                      </p>
                    </div>
                  )}
                </div>

                {/* Profile Picture Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Profile Picture') || 'Profile Picture'}
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-2xl text-gray-400 font-bold">
                            {profile?.full_name?.charAt(0).toUpperCase() || (isStaff ? 'S' : 'A')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors">
                        <Camera className="w-4 h-4" />
                        <span className="text-sm font-medium">Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        Upload a new profile picture (JPG, PNG, GIF up to 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* ID Field - Read Only for both */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isStaff ? 'Staff ID' : 'Admin ID'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={isStaff
                        ? (staffProfile?.admin_id || '')
                        : (adminProfile?.admin_id || '')
                      }
                      readOnly
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Read Only
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full md:w-auto px-6 py-3 bg-${buttonColor}-600 text-white rounded-lg hover:bg-${buttonColor}-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {t('profile.save') || 'Save Changes'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Change Password Form */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Lock className={`w-5 h-5 text-${buttonColor}-600`} />
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('profile.changePassword') || 'Change Password'}
                </h2>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.currentPassword') || 'Current Password'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={isStaff ? passwordData.old_password : passwordData.current_password}
                    onChange={(e) =>
                      isStaff
                        ? setPasswordData({
                          ...passwordData,
                          old_password: e.target.value,
                        })
                        : setPasswordData({
                          ...passwordData,
                          current_password: e.target.value,
                        })
                    }
                    className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${buttonColor}-500 focus:border-transparent transition-all`}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('profile.newPassword') || 'New Password'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          new_password: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${buttonColor}-500 focus:border-transparent transition-all`}
                      placeholder="Enter new password"
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('profile.confirmPassword') || 'Confirm Password'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirm_password: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${buttonColor}-500 focus:border-transparent transition-all`}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full md:w-auto px-6 py-3 bg-${buttonColor}-600 text-white rounded-lg hover:bg-${buttonColor}-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        {t('profile.updatePassword') || 'Update Password'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Staff Permissions Card - Only for staff */}
          {/* {isStaff && staffProfile?.permissions && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your Permissions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(staffProfile.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 capitalize">
                      {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {value ? 'Allowed' : 'Denied'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )} */}

          {/* Account Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">User Type</p>
                  <p className="font-medium capitalize">{profile?.user_type || (isStaff ? 'staff' : 'admin')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile?.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {profile?.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {profile?.last_login && (
                  <div>
                    <p className="text-sm text-gray-600">Last Login</p>
                    <p className="font-medium">
                      {new Date(profile.last_login).toLocaleString()}
                    </p>
                  </div>
                )}
                {profile?.created_at && (
                  <div>
                    <p className="text-sm text-gray-600">Account Created</p>
                    <p className="font-medium">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}