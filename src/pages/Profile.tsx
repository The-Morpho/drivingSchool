import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Shield, Building, CreditCard, BookOpen, MapPin, Hash } from 'lucide-react';
import { roleDescriptions } from '../utils/rolePermissions';
import { apiService } from '../services/api';

interface UserData {
  _id: string;
  account_id: number;
  username: string;
  email: string;
  role: string;
  userType: string;
  first_name: string;
  last_name: string;
  isActive: boolean;
  createdAt: string;
  // Optional fields from Manager/Staff/Customer
  phone_number?: string;
  date_of_birth?: string;
  address_id?: number;
  hire_date?: string;
  date_hired?: string;
  license_number?: string;
  emergency_contact?: string;
  manager_id?: number;
  staff_id?: number;
  customer_id?: number;
  nickname?: string;
  amount_outstanding?: number;
  email_address?: string;
}

export const Profile: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [addressData, setAddressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userStr = localStorage.getItem('user');
        console.log('Raw user string:', userStr);
        
        if (!userStr) {
          setError('No user data found');
          setLoading(false);
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
          return;
        }

        const user: UserData = JSON.parse(userStr);
        console.log('Parsed user data:', user);
        
        // Validate user data has required fields
        if (!user.account_id || !user.username || !user.role || !user.userType) {
          console.error('Incomplete user data:', user);
          setError('Invalid user data - please login again');
          setLoading(false);
          localStorage.removeItem('user');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
          return;
        }
        
        setUserData(user);

        // Load address if user has address_id
        if (user.address_id) {
          try {
            const addressRes = await apiService.addresses.getById(user.address_id.toString());
            setAddressData(addressRes.data);
          } catch (err) {
            console.error('Error loading address:', err);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile - please login again');
        setLoading(false);
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!userData || error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="text-red-600 text-lg font-semibold">{error || 'No profile data available'}</div>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  const { role, username, first_name, last_name, email, phone_number, date_of_birth } = userData;

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'manager': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'staff': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'customer': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDisplayName = () => {
    if (userData.first_name && userData.last_name) {
      return `${userData.first_name} ${userData.last_name}`;
    }
    return username;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-blue-100">View and manage your account information</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -mr-16 -mt-16"></div>
        <div className="flex items-center space-x-6 relative">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 shadow-lg">
            <User size={56} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800">{getDisplayName()}</h2>
            <p className="text-gray-600 mt-1 font-medium">@{username}</p>
            {email && (
              <p className="text-gray-500 text-sm mt-1">{email}</p>
            )}
            <div className="mt-4">
              <span className={`inline-block px-4 py-2 rounded-xl text-sm font-bold border-2 ${getRoleBadgeColor(role)}`}>
                {role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-3 rounded-xl mr-3">
              <Shield className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Account Information</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center text-gray-700">
              <User className="mr-3 text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-semibold">@{username}</p>
              </div>
            </div>
            {email && (
              <div className="flex items-center text-gray-700">
                <Mail className="mr-3 text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold">{email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center text-gray-700">
              <Shield className="mr-3 text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-semibold capitalize">{role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Role Description */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
          <div className="flex items-center mb-6">
            <div className="bg-purple-100 p-3 rounded-xl mr-3">
              <Building className="text-purple-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Role & Permissions</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            {roleDescriptions[role.toLowerCase() as keyof typeof roleDescriptions] || 'No description available'}
          </p>
          <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800 font-semibold">
              <strong>Access Level:</strong> {role}
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
          <div className="flex items-center mb-6">
            <div className="bg-green-100 p-3 rounded-xl mr-3">
              <User className="text-green-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
          </div>
          <div className="space-y-3">
            {phone_number && (
              <div className="flex items-center text-gray-700">
                <Phone className="mr-3 text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-semibold">{phone_number}</p>
                </div>
              </div>
            )}
            {date_of_birth && (
              <div className="flex items-center text-gray-700">
                <Calendar className="mr-3 text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-semibold">{formatDate(date_of_birth)}</p>
                </div>
              </div>
            )}
            {userData.date_hired && (
              <div className="flex items-center text-gray-700">
                <Calendar className="mr-3 text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Date Hired</p>
                  <p className="font-semibold">{formatDate(userData.date_hired)}</p>
                </div>
              </div>
            )}
            {userData.nickname && (
              <div className="flex items-center text-gray-700">
                <User className="mr-3 text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Nickname</p>
                  <p className="font-semibold">{userData.nickname}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Address Information */}
        {addressData && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Building className="text-blue-600 mr-2" size={24} />
              <h3 className="text-xl font-bold text-gray-800">Address</h3>
            </div>
            <div className="space-y-2 text-gray-700">
              {addressData.street_1 && <p>{addressData.street_1}</p>}
              {addressData.street_2 && <p>{addressData.street_2}</p>}
              <p>
                {addressData.city && `${addressData.city}, `}
                {addressData.state && `${addressData.state} `}
                {addressData.zip_code && addressData.zip_code}
              </p>
              {addressData.country && <p>{addressData.country}</p>}
            </div>
          </div>
        )}

        {/* Customer-specific: Account Balance */}
        {role === 'customer' && userData.amount_outstanding !== undefined && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <CreditCard className="text-blue-600 mr-2" size={24} />
              <h3 className="text-xl font-bold text-gray-800">Account Balance</h3>
            </div>
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-2">Amount Outstanding</p>
              <p className="text-4xl font-bold text-gray-800">
                ${userData.amount_outstanding?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        )}

        {/* ID Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <BookOpen className="text-blue-600 mr-2" size={24} />
            <h3 className="text-xl font-bold text-gray-800">System Information</h3>
          </div>
          <div className="space-y-3">
            {userData.customer_id && (
              <div className="text-gray-700">
                <p className="text-sm text-gray-500">Customer ID</p>
                <p className="font-semibold">#{userData.customer_id}</p>
              </div>
            )}
            {userData.staff_id && (
              <div className="text-gray-700">
                <p className="text-sm text-gray-500">Staff ID</p>
                <p className="font-semibold">#{userData.staff_id}</p>
              </div>
            )}
            {userData.manager_id && (
              <div className="text-gray-700">
                <p className="text-sm text-gray-500">Manager ID</p>
                <p className="font-semibold">#{userData.manager_id}</p>
              </div>
            )}
            {userData.address_id && (
              <div className="text-gray-700">
                <p className="text-sm text-gray-500">Address ID</p>
                <p className="font-semibold">#{userData.address_id}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
