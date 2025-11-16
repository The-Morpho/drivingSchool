import React, { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';
import { Modal } from '../components/Modal';
import { Plus, UserCheck, Users, Calendar, User, Mail, Phone, Lock, CheckCircle, UserX, Info } from 'lucide-react';

interface StaffForm {
  // Staff model fields
  staff_id?: number;
  staff_address_id?: number;
  nickname: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  date_joined_staff: string;
  date_left_staff: string;
  email_address: string;
  phone_number: string;
  position_title?: string;
  
  // Account fields (for creation only)
  password?: string;
  confirmPassword?: string;
  role?: string;
  isActive?: boolean;
  
  // Address fields
  line_1_number_building?: string;
  city?: string;
  zip_postcode?: string;
  state_province_county?: string;
  country?: string;
}

export const Staff: React.FC = () => {
  const { data, loading, refetch } = useFetch(() => apiService.staff.getAll());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);

  // search state
  const [query, setQuery] = useState<string>('');

  const [form, setForm] = useState<StaffForm>({
    nickname: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    date_joined_staff: '',
    date_left_staff: '',
    email_address: '',
    phone_number: '',
    position_title: '',
    // Account fields
    password: '',
    confirmPassword: '',
    role: 'Staff',
    isActive: true,
    // Address fields
    line_1_number_building: '',
    city: '',
    zip_postcode: '',
    state_province_county: '',
    country: '',
  });

  // details modal state (manager)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [staffLessons, setStaffLessons] = useState<any[]>([]);
  const [staffCustomers, setStaffCustomers] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // delete confirmation modal state (replace window.confirm)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch addresses on component mount
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await apiService.addresses?.getAll();
        setAddresses(response?.data || []);
      } catch (error) {
        console.error('Error fetching addresses:', error);
        setAddresses([]);
      }
    };
    fetchAddresses();
  }, []);

  const handleOpenModal = (staff?: any) => {
    if (staff) {
      // Find the address for this staff member
      const staffAddress = addresses.find(addr => addr.address_id === staff.staff_address_id);
      
      // For editing - populate staff fields only, no password/account fields
      setForm({
        nickname: staff.nickname || '',
        first_name: staff.first_name || '',
        last_name: staff.last_name || '',
        date_of_birth: staff.date_of_birth || '',
        date_joined_staff: staff.date_joined_staff || '',
        date_left_staff: staff.date_left_staff || '',
        email_address: staff.email_address || '',
        phone_number: staff.phone_number || '',
        position_title: staff.position_title || '',
        staff_address_id: staff.staff_address_id,
        staff_id: staff.staff_id,
        // Address fields from the fetched address
        line_1_number_building: staffAddress?.line_1_number_building || '',
        city: staffAddress?.city || '',
        zip_postcode: staffAddress?.zip_postcode || '',
        state_province_county: staffAddress?.state_province_county || '',
        country: staffAddress?.country || '',
        // Account fields not editable in update mode
        password: '',
        confirmPassword: '',
        role: 'Staff',
        isActive: true,
      });
      setEditingId(staff._id);
    } else {
      // For creation - all fields available
      setForm({
        nickname: '',
        first_name: '',
        last_name: '',
        date_of_birth: '',
        date_joined_staff: new Date().toISOString().split('T')[0], // Default to today
        date_left_staff: '',
        email_address: '',
        phone_number: '',
        position_title: '',
        // Account fields
        password: '',
        confirmPassword: '',
        role: 'Staff',
        isActive: true,
        // Address fields
        line_1_number_building: '',
        city: '',
        zip_postcode: '',
        state_province_county: '',
        country: '',
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate required fields
      if (!form.nickname.trim() || !form.first_name.trim() || !form.last_name.trim() || !form.email_address.trim()) {
        alert('Please fill in all required fields (nickname, first name, last name, email)');
        return;
      }

      // For new staff creation, validate password
      if (!editingId) {
        if (!form.password || form.password.length < 6) {
          alert('Password must be at least 6 characters long');
          return;
        }
        if (form.password !== form.confirmPassword) {
          alert('Passwords do not match');
          return;
        }
      }

      // Build payload
      const payload: any = {
        nickname: form.nickname.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        date_of_birth: form.date_of_birth,
        date_joined_staff: form.date_joined_staff,
        date_left_staff: form.date_left_staff,
        email_address: form.email_address.trim(),
        phone_number: form.phone_number.trim(),
        position_title: form.position_title?.trim(),
      };

      // For creation, include account and address data
      if (!editingId) {
        payload.password = form.password;
        payload.role = form.role;
        payload.isActive = form.isActive;
        
        // Include address data if all required fields are provided
        const hasRequiredAddressFields = form.line_1_number_building?.trim() && form.city?.trim() && form.zip_postcode?.trim();
        const hasAnyAddressField = form.line_1_number_building?.trim() || form.city?.trim() || form.zip_postcode?.trim() || 
                                  form.state_province_county?.trim() || form.country?.trim();
        
        if (hasAnyAddressField && !hasRequiredAddressFields) {
          alert('To save an address, please provide Building/Street, City, and ZIP code.');
          return;
        }
        
        if (hasRequiredAddressFields) {
          payload.address = {
            line_1_number_building: form.line_1_number_building!.trim(),
            city: form.city!.trim(),
            zip_postcode: form.zip_postcode!.trim(),
            state_province_county: form.state_province_county?.trim() || '',
            country: form.country?.trim() || '',
          };
        }
      }

      if (editingId) {
        await apiService.staff.update(editingId, payload);
      } else {
        console.log('Creating staff with payload:', payload);
        await apiService.staff.create(payload);
      }

      refetch();
      // Also refetch addresses to get the newly created address
      try {
        const response = await apiService.addresses?.getAll();
        setAddresses(response?.data || []);
      } catch (error) {
        console.error('Error refreshing addresses:', error);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving staff:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error saving staff. Please try again.';
      alert(errorMessage);
    }
  };

  // delete flow using modal
  const initiateDelete = (staff: any) => {
    setStaffToDelete(staff);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    setIsDeleting(true);
    try {
      await apiService.staff.delete(staffToDelete._id);
      refetch();
      setDeleteModalOpen(false);
      setStaffToDelete(null);
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      alert(error?.response?.data?.error || error?.message || 'Failed to delete staff');
    } finally {
      setIsDeleting(false);
    }
  };

  // Details modal: fetch lessons & customers related to this staff (manager only)
  const openDetailsForStaff = async (staff: any) => {
    setSelectedStaff(staff);
    setDetailsModalOpen(true);
    setLoadingDetails(true);
    try {
      const lessonsRes = await apiService.lessons.getAll();
      const lessons = lessonsRes.data || [];
      const staffLessonsList = lessons.filter((l: any) => String(l.staff_id) === String(staff.staff_id));
      setStaffLessons(staffLessonsList);

      // gather unique customer_ids from those lessons and fetch customers
      const customerIds = Array.from(new Set(staffLessonsList.map((l: any) => l.customer_id))).filter(Boolean);
      if (customerIds.length > 0) {
        const customersRes = await apiService.customers.getAll();
        const customers = customersRes.data || [];
        const matched = customers.filter((c: any) => customerIds.includes(c.customer_id));
        setStaffCustomers(matched);
      } else {
        setStaffCustomers([]);
      }
    } catch (err) {
      console.error('Error loading details for staff:', err);
      setStaffLessons([]);
      setStaffCustomers([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-16">
      <div className="text-gray-600 text-lg">Loading staff...</div>
    </div>
  );

  // search/filter logic
  const filteredData = (data || []).filter((s: any) => {
    if (!query || query.trim() === '') return true;
    const q = query.trim().toLowerCase();
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    return (
      String(s.staff_id || '').toLowerCase().includes(q) ||
      fullName.includes(q) ||
      (s.nickname || '').toLowerCase().includes(q) ||
      (s.email_address || '').toLowerCase().includes(q)
    );
  });

  const activeStaff = data.filter((s: any) => s.date_left_staff ? false : true).length;
  const recentJoins = data.filter((s: any) => {
    const joinDate = new Date(s.date_joined_staff);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return joinDate > sixMonthsAgo;
  }).length;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="relative flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Staff Management</h1>
            <p className="text-green-100">Manage instructors and staff members</p>

            {/* Search bar */}
            <div className="mt-4 max-w-md">
              <label className="sr-only" htmlFor="staff-search">Search staff</label>
              <div className="relative">
                <input
                  id="staff-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by id, name, nickname or email..."
                  className="w-full px-4 py-2 rounded-lg text-gray-800 bg-white/90 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-300"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
                    aria-label="Clear search"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-white text-green-600 px-6 py-3 rounded-xl hover:bg-green-50 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 hover:scale-105"
          >
            <Plus size={22} />
            Add Staff
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium mb-1">Total Staff</p>
              <p className="text-3xl font-bold text-green-900">{data.length}</p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <Users className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium mb-1">Active Staff</p>
              <p className="text-3xl font-bold text-blue-900">{activeStaff}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <UserCheck className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium mb-1">Recent Joins</p>
              <p className="text-3xl font-bold text-purple-900">{recentJoins}</p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <Calendar className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Staff Grid - Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No staff members yet</p>
            <p className="text-sm">Click "Add Staff" to create your first staff member</p>
          </div>
        ) : (
          filteredData.map((staff: any) => {
            // Find the address for this staff member
            const staffAddress = addresses.find(addr => addr.address_id === staff.staff_address_id);
            
            return (
            <div key={staff._id} className="border-l-4 border-green-400 bg-green-50 rounded-xl shadow-md hover:shadow-xl transition-all p-6 space-y-4">
              {/* Header with ID */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <UserCheck className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Staff ID</p>
                    <p className="text-lg font-bold text-gray-900">#{staff.staff_id}</p>
                  </div>
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold border border-green-200">
                  {staff.position_title || staff.role || 'Staff'}
                </div>
              </div>

              {/* Staff Name */}
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 font-medium mb-1">Full Name</p>
                <p className="text-xl font-bold text-gray-900">{staff.first_name} {staff.last_name}</p>
              </div>

              {/* Nickname/Username */}
              {staff.nickname && (
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-medium mb-1">Nickname</p>
                  <p className="text-sm font-semibold text-gray-700">@{staff.nickname}</p>
                </div>
              )}

              {/* Contact Info */}
              <div className="bg-white rounded-lg p-3 space-y-2">
                {staff.email_address && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-green-600" />
                    <p className="text-sm text-gray-700">{staff.email_address}</p>
                  </div>
                )}
                {staff.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-green-600" />
                    <p className="text-sm text-gray-700">{staff.phone_number}</p>
                  </div>
                )}
              </div>

              {/* Address Info */}
              {staffAddress && (
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-medium mb-1">Address</p>
                  <div className="text-sm text-gray-700">
                    {staffAddress.line_1_number_building && (
                      <p>{staffAddress.line_1_number_building}</p>
                    )}
                    <p>
                      {[staffAddress.city, staffAddress.state_province_county].filter(Boolean).join(', ')}
                      {staffAddress.zip_postcode && ` ${staffAddress.zip_postcode}`}
                    </p>
                    {staffAddress.country && <p>{staffAddress.country}</p>}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => handleOpenModal(staff)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  Edit
                </button>

                {/* Details button for managers */}
                <button
                  onClick={() => openDetailsForStaff(staff)}
                  className="flex-1 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Info size={16} />
                  Details
                </button>

                <button
                  onClick={() => initiateDelete(staff)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <UserX size={16} />
                  Delete
                </button>
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Edit/Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Staff' : 'Add New Staff Member'}>
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Basic Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <User size={18} className="text-green-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  First Name *
                </label>
                <input 
                  type="text" 
                  placeholder="Enter first name" 
                  value={form.first_name} 
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Last Name *
                </label>
                <input 
                  type="text" 
                  placeholder="Enter last name" 
                  value={form.last_name} 
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nickname *
                </label>
                <input 
                  type="text" 
                  placeholder="Username/nickname" 
                  value={form.nickname} 
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                  required 
                  readOnly={!!editingId}
                />
                {editingId && <p className="text-xs text-gray-500 mt-1">Nickname cannot be changed</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input 
                  type="email" 
                  placeholder="staff@example.com" 
                  value={form.email_address} 
                  onChange={(e) => setForm({ ...form, email_address: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input 
                  type="tel" 
                  placeholder="(123) 456-7890" 
                  value={form.phone_number} 
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input 
                  type="date" 
                  value={form.date_of_birth} 
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Date Joined *
                </label>
                <input 
                  type="date" 
                  value={form.date_joined_staff} 
                  onChange={(e) => setForm({ ...form, date_joined_staff: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Date Left
                </label>
                <input 
                  type="date" 
                  value={form.date_left_staff} 
                  onChange={(e) => setForm({ ...form, date_left_staff: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Position / Title
              </label>
              <input 
                type="text" 
                placeholder="Instructor, Manager, ..." 
                value={form.position_title || ''} 
                onChange={(e) => setForm({ ...form, position_title: e.target.value })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
              />
            </div>
          </div>

          {/* Account Information Section (Only for new staff) */}
          {!editingId && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Lock size={18} className="text-blue-600" />
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Role *
                  </label>
                  <select 
                    value={form.role} 
                    onChange={(e) => setForm({ ...form, role: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="Staff">👥 Staff</option>
                    <option value="Manager">👑 Manager</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    checked={form.isActive} 
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })} 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-gray-700">
                    Account Active
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Password *
                  </label>
                  <input 
                    type="password" 
                    placeholder="Enter password" 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input 
                    type="password" 
                    placeholder="Confirm password" 
                    value={form.confirmPassword} 
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Address Information Section (Optional) */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <User size={18} className="text-yellow-600" />
              Address Information (Optional)
            </h3>
            <div className="mb-3 p-3 bg-yellow-100 rounded-lg text-sm text-yellow-800">
              <p className="font-medium">📍 Address Requirements:</p>
              <p>To save an address, you must provide at least: Building/Street, City, and ZIP code.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Building/Street Number *
                </label>
                <input 
                  type="text" 
                  placeholder="123 Main St" 
                  value={form.line_1_number_building} 
                  onChange={(e) => setForm({ ...form, line_1_number_building: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all" 
                />
                <p className="text-xs text-gray-500 mt-1">Required for address creation</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  City *
                </label>
                <input 
                  type="text" 
                  placeholder="City name" 
                  value={form.city} 
                  onChange={(e) => setForm({ ...form, city: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all" 
                />
                <p className="text-xs text-gray-500 mt-1">Required for address creation</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ZIP/Postal Code *
                </label>
                <input 
                  type="text" 
                  placeholder="12345" 
                  value={form.zip_postcode} 
                  onChange={(e) => setForm({ ...form, zip_postcode: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all" 
                />
                <p className="text-xs text-gray-500 mt-1">Required for address creation</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  State/Province
                </label>
                <input 
                  type="text" 
                  placeholder="State or Province" 
                  value={form.state_province_county} 
                  onChange={(e) => setForm({ ...form, state_province_county: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Country
                </label>
                <input 
                  type="text" 
                  placeholder="Country" 
                  value={form.country} 
                  onChange={(e) => setForm({ ...form, country: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all" 
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-teal-700 font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2">
            <UserCheck size={20} />
            {editingId ? 'Update Staff Member' : 'Create Staff Member'}
          </button>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={detailsModalOpen} title="Staff Details" onClose={() => { setDetailsModalOpen(false); setSelectedStaff(null); setStaffLessons([]); setStaffCustomers([]); }}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Staff Details</h2>
          {selectedStaff && (
            <div className="bg-white rounded p-4">
              <p className="font-semibold">{selectedStaff.first_name} {selectedStaff.last_name} (@{selectedStaff.nickname})</p>
              <p className="text-sm text-gray-600">{selectedStaff.email_address}</p>
              <p className="text-sm text-gray-600">Phone: {selectedStaff.phone_number || '—'}</p>
              <p className="text-sm text-gray-600">Position: {selectedStaff.position_title || '—'}</p>
              <p className="text-sm text-gray-600">Joined: {selectedStaff.date_joined_staff || '—'}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold">Customers taught</h3>
            {loadingDetails ? <p>Loading...</p> : staffCustomers.length === 0 ? <p className="text-sm text-gray-500">No customers found</p> : (
              <ul className="space-y-2">
                {staffCustomers.map((c: any) => (
                  <li key={c._id} className="p-2 border rounded bg-white">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{c.first_name} {c.last_name}</div>
                        <div className="text-xs text-gray-500">#{c.customer_id} — {c.email_address}</div>
                      </div>
                      <div className="text-sm text-gray-700">${(c.amount_outstanding || 0).toFixed(2)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="font-semibold">Lessons with these customers</h3>
            {loadingDetails ? <p>Loading...</p> : staffLessons.length === 0 ? <p className="text-sm text-gray-500">No lessons found</p> : (
              <ul className="space-y-2">
                {staffLessons.map((l: any) => (
                  <li key={l._id} className="p-2 border rounded bg-white">
                    <div className="flex justify-between">
                      <div>
                        <div className="text-sm font-medium">{l.lesson_date} {l.lesson_time || ''}</div>
                        <div className="text-xs text-gray-500">Customer ID: {l.customer_id}</div>
                      </div>
                      <div className="text-sm font-semibold">{l.price ? `$${Number(l.price).toFixed(2)}` : '—'}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setStaffToDelete(null); }} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete <strong>{staffToDelete?.first_name} {staffToDelete?.last_name}</strong>? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setDeleteModalOpen(false); setStaffToDelete(null); }} className="px-4 py-2 rounded border">Cancel</button>
            <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
