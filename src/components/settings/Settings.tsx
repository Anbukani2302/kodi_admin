import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Settings as SettingsIcon, Shield, Activity } from 'lucide-react';

export function Settings() {
  const { t, language, setLanguage } = useLanguage();

  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'KODI Genealogy Platform',
    timezone: 'Asia/Kolkata',
    language: language,
    dateFormat: 'DD/MM/YYYY',
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: true,
    sessionTimeout: 30,
    passwordPolicy: true,
  });

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLanguage(generalSettings.language as 'en' | 'ta');
    alert('Settings saved successfully!');
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Security settings updated successfully!');
  };

  const systemStatus = [
    { name: 'Database', status: 'Operational', color: 'bg-green-500' },
    { name: 'Storage', status: 'Operational', color: 'bg-green-500' },
    { name: 'API', status: 'Operational', color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t('settings.title')}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* General Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <SettingsIcon className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t('settings.general')}
              </h2>
            </div>
            <form onSubmit={handleGeneralSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('settings.systemName')}
                </label>
                <input
                  type="text"
                  value={generalSettings.systemName}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      systemName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('settings.timezone')}
                </label>
                <select
                  value={generalSettings.timezone}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      timezone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('settings.language')}
                </label>
                <select
                  value={generalSettings.language}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      language: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="en">English</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('settings.dateFormat')}
                </label>
                <select
                  value={generalSettings.dateFormat}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      dateFormat: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('settings.save')}
              </button>
            </form>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t('settings.security')}
              </h2>
            </div>
            <form onSubmit={handleSecuritySubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    {t('settings.twoFactor')}
                  </label>
                  <p className="text-xs text-gray-500">
                    Require two-factor authentication for all users
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.twoFactor}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        twoFactor: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('settings.sessionTimeout')} ({t('settings.minutes')})
                </label>
                <input
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      sessionTimeout: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  min="5"
                  max="120"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    {t('settings.passwordPolicy')}
                  </label>
                  <p className="text-xs text-gray-500">
                    Enforce strong password requirements
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.passwordPolicy}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordPolicy: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('settings.save')}
              </button>
            </form>
          </div>
        </div>

        {/* System Status */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t('settings.systemStatus')}
              </h2>
            </div>
            <div className="space-y-4">
              {systemStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs text-green-600 font-medium">
                    {t('settings.operational')}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800 text-center font-medium">
                All Systems Operational
              </p>
              <p className="text-xs text-green-600 text-center mt-1">
                Uptime: 99.9%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
