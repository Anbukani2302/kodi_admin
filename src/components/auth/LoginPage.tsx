import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from 'next-themes';

import {
  Lock,
  Mail,
  Phone,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import logo from '../../images/logo.png';

export function LoginPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  // Mobile number validation function
  const validateMobileNumber = (number: string) => {
    // Remove any non-digit characters
    const cleaned = number.replace(/\D/g, '');

    if (cleaned.length === 0) {
      setMobileError('');
      return false;
    } else if (cleaned.length !== 10) {
      setMobileError(t('auth.mobileNumberMustBe10Digits') || 'Mobile number must be exactly 10 digits');
      return false;
    } else {
      setMobileError('');
      return true;
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits
    const digitsOnly = value.replace(/\D/g, '');

    setFormData({
      ...formData,
      mobile_number: digitsOnly,
    });

    validateMobileNumber(digitsOnly);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate mobile number before submission
    const isMobileValid = validateMobileNumber(formData.mobile_number);

    if (!isMobileValid) {
      setError(t('auth.enterValidMobile') || 'Please enter a valid 10-digit mobile number');
      return;
    }

    setError('');
    setMobileError('');
    setLoading(true);

    try {
      // Try admin login first
      await login(
        formData.full_name,
        formData.mobile_number,
        formData.email,
        formData.password,
        'admin'
      );

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);

      // Check for specific mobile number error from backend
      if (err.response?.data?.mobile_number) {
        // Handle array or string format
        const mobileErrorMsg = Array.isArray(err.response.data.mobile_number)
          ? err.response.data.mobile_number[0]
          : err.response.data.mobile_number;

        setMobileError(mobileErrorMsg);
        setError('');
      }
      // Try staff login if admin fails and it's not a mobile number error
      else {
        try {
          await login(
            formData.full_name,
            formData.mobile_number,
            formData.email,
            formData.password,
            'staff'
          );

          navigate('/dashboard');
        } catch (staffErr: any) {
          // Check for specific mobile number error from backend for staff login
          if (staffErr.response?.data?.mobile_number) {
            const mobileErrorMsg = Array.isArray(staffErr.response.data.mobile_number)
              ? staffErr.response.data.mobile_number[0]
              : staffErr.response.data.mobile_number;

            setMobileError(mobileErrorMsg);
            setError('');
          } else {
            // Show generic error message
            setError(
              staffErr.response?.data?.message ||
              staffErr.message ||
              t('auth.invalidCredentials') ||
              'Invalid credentials. Please check your details and try again.'
            );
            setMobileError('');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'mobile_number') {
      handleMobileChange(e);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (error) setError('');
    if (mobileError) setMobileError('');
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#FDFDFD] px-4 transition-all duration-700 relative overflow-hidden">
      {/* Background patterns */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#DC2626 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="absolute top-[-20%] left-[-10%] w-125 h-125 bg-red-50 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-[-20%] right-[-10%] w-125 h-125 bg-gray-100 rounded-full blur-[120px] opacity-60" />

     

      {/* Login Form */}
      <div className="max-w-md w-full relative z-10">
        <div className="flex justify-center mb-6">
          <img src={logo} alt={t('auth.logo') || 'Logo'} className="w-16 h-16" />
        </div>

        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {t('auth.welcome')}
          </h1>
          <p className="text-gray-600">
            {t('auth.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border p-8">
          {/* Login Text Inside Card */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {t('auth.login') || 'Login'}
            </h2>
            <div className="w-16 h-1 bg-red-600 mx-auto mt-2 rounded-full"></div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                placeholder={t('auth.name')}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder={t('auth.email')}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleInputChange}
                  required
                  placeholder={t('auth.phone')}
                  maxLength={10}
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl border outline-none transition-all ${mobileError
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    }`}
                  disabled={loading}
                />
                {mobileError && (
                  <p className="absolute text-red-600 text-xs mt-1 ml-1">
                    {mobileError}
                  </p>
                )}
              </div>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder={t('auth.password')}
                className="w-full pl-11 pr-12 py-3 rounded-2xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm font-medium flex items-center">
                  <span className="mr-2">⚠️</span>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 ${loading
                  ? 'bg-red-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 active:scale-[0.98]'
                } text-white shadow-md hover:shadow-lg`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('signingIn') || 'SIGNING IN...'}
                </span>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}