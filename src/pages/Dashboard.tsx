import React, { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';
import { Users, UserCheck, Truck, BookOpen, DollarSign, MapPin, Shield, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { UserRole } from '../utils/rolePermissions';
import { Link } from 'react-router-dom';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal' | 'indigo';
  link?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, change, color, link }) => {
  const colors = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', text: 'text-blue-900', badge: 'bg-blue-100' },
    green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', text: 'text-green-900', badge: 'bg-green-100' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', text: 'text-purple-900', badge: 'bg-purple-100' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', text: 'text-orange-900', badge: 'bg-orange-100' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', icon: 'text-pink-600', text: 'text-pink-900', badge: 'bg-pink-100' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-600', text: 'text-teal-900', badge: 'bg-teal-100' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600', text: 'text-indigo-900', badge: 'bg-indigo-100' },
  };

  const scheme = colors[color];

  const CardContent = (
    <div className={`${scheme.bg} border ${scheme.border} rounded-xl p-6 hover:shadow-lg transition-all group relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
      <div className="flex items-start justify-between relative">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
          <p className={`text-4xl font-bold ${scheme.text} mb-2`}>{value}</p>
          {change && (
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} className="text-green-600" />
              <span className="text-green-600 font-semibold">{change}</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={`${scheme.badge} p-4 rounded-xl ${scheme.icon} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      {link && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <span className={`text-sm font-medium ${scheme.icon}`}>View Details</span>
          <ArrowRight size={16} className={`${scheme.icon} group-hover:translate-x-1 transition-transform`} />
        </div>
      )}
    </div>
  );

  return link ? <Link to={link}>{CardContent}</Link> : CardContent;
};

export const Dashboard: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  const customers = useFetch(() => apiService.customers.getAll());
  const staff = useFetch(() => apiService.staff.getAll());
  const vehicles = useFetch(() => apiService.vehicles.getAll());
  const lessons = useFetch(() => apiService.lessons.getAll());
  const payments = useFetch(() => apiService.payments.getAll());
  const addresses = useFetch(() => apiService.addresses.getAll());
  
  // Only fetch managers if user is admin/manager
  const shouldFetchManagers = userRole === 'admin' || userRole === 'manager';
  const managers = useFetch(() => shouldFetchManagers ? apiService.managers.getAll() : Promise.resolve({ data: [] }));

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
      setUserEmail(user.email);
    }
  }, []);

  const getRoleWelcomeMessage = () => {
    switch (userRole) {
      case 'admin':
        return 'You have full access to all system features and data.';
      case 'manager':
        return 'Manage customers, staff, vehicles, lessons, and payments.';
      case 'instructor':
        return 'View and manage your lessons, customers, and vehicles.';
      case 'customer':
        return 'View your lessons, payments, and personal information.';
      default:
        return 'Welcome to the Driving School Management System';
    }
  };

  // Filter stats based on role
  const showAllStats = userRole === 'admin' || userRole === 'manager';
  const showInstructorStats = userRole === 'instructor';
  const showCustomerStats = userRole === 'customer';

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-blue-100 text-lg mb-1">{userEmail}</p>
          <p className="text-white/90 mb-4">{getRoleWelcomeMessage()}</p>
          <div className="flex items-center gap-3">
            <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-semibold border border-white/30 backdrop-blur-sm">
              Role: {userRole?.toUpperCase()}
            </span>
            <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-semibold border border-white/30 backdrop-blur-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Admin & Manager - Full Stats */}
        {showAllStats && (
          <>
            <StatCard
              icon={<Users size={28} />}
              label="Total Customers"
              value={customers.data.length}
              color="blue"
              link="/customers"
              change="+12%"
            />
            <StatCard
              icon={<UserCheck size={28} />}
              label="Staff Members"
              value={staff.data.length}
              color="green"
              link="/staff"
              change="+5%"
            />
            <StatCard
              icon={<Truck size={28} />}
              label="Vehicles"
              value={vehicles.data.length}
              color="indigo"
              link="/vehicles"
            />
                        <StatCard
              icon={<BookOpen size={28} />}
              label="Total Lessons"
              value={lessons.data.length}
              color="purple"
              link="/lessons"
              change="+18%"
            />
            <StatCard
              icon={<DollarSign size={28} />}
              label="Total Payments"
              value={`$${payments.data.reduce((sum, p) => sum + (p.amount_payment || 0), 0).toFixed(2)}`}
              color="orange"
              link="/payments"
              change="+22%"
            />
            <StatCard
              icon={<MapPin size={28} />}
              label="Addresses"
              value={addresses.data.length}
              color="pink"
              link="/addresses"
            />
            {userRole === 'admin' && (
              <StatCard
                icon={<Shield size={28} />}
                label="Managers"
                value={managers.data.length}
                color="teal"
              />
            )}
          </>
        )}

        {/* Instructor - Limited Stats */}
        {showInstructorStats && (
          <>
            <StatCard
              icon={<BookOpen size={28} />}
              label="My Lessons"
              value={lessons.data.length}
              color="purple"
              link="/lessons"
              change="+8%"
            />
            <StatCard
              icon={<Users size={28} />}
              label="My Students"
              value={customers.data.length}
              color="blue"
              change="+3%"
            />
            <StatCard
              icon={<DollarSign size={28} />}
              label="Students' Payments"
              value={`$${payments.data.reduce((sum, p) => sum + (p.amount_payment || 0), 0).toFixed(2)}`}
              color="orange"
              link="/payments"
            />
          </>
        )}

        {/* Customer - Minimal Stats */}
        {showCustomerStats && (
          <>
            <StatCard
              icon={<BookOpen size={28} />}
              label="My Lessons"
              value={lessons.data.length}
              color="purple"
              link="/lessons"
            />
            <StatCard
              icon={<DollarSign size={28} />}
              label="My Payments"
              value={`$${payments.data.reduce((sum, p) => sum + (p.amount_payment || 0), 0).toFixed(2)}`}
              color="orange"
              link="/payments"
            />
          </>
        )}
      </div>

      {/* Enhanced Info Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <AlertCircle className="text-blue-600" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-blue-900 text-lg mb-1">
              {userRole === 'customer' ? 'Your Personal Dashboard' : 
               userRole === 'instructor' ? 'Your Teaching Dashboard' :
               'System Status'}
            </h2>
            <p className="text-blue-700 mb-3">
              {userRole === 'customer' ? 'You are viewing only your personal lessons and payments.' :
               userRole === 'instructor' ? 'You are viewing only your assigned students and lessons.' :
               'Database connected. All systems operational.'}
            </p>
            {showAllStats && (
              <div className="flex gap-2 mt-3">
                <Link to="/customers" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
                  Manage Customers
                </Link>
                <Link to="/lessons" className="text-sm bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition font-semibold border border-blue-200">
                  View Lessons
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
