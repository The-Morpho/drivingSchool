import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';
import { Modal } from '../components/Modal';
import { Plus, UserCheck, Users, Calendar, User, Mail, Phone, Lock, Award, CheckCircle, UserX } from 'lucide-react';

interface StaffForm {
  staff_id?: number;
  staff_address_id?: number;
  nickname: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string;
  date_joined_staff: string;
  date_left_staff: string;
  email_address: string;
  phone_number: string;
  password?: string;
  confirmPassword?: string;
  line_1_number_building?: string;
  city?: string;
  zip_postcode?: string;
  state_province_county?: string;
  country?: string;
  isActive?: boolean;
}

export const Staff: React.FC = () => {
  const { data, loading, refetch } = useFetch(() => apiService.staff.getAll());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffForm>({
    nickname: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    date_of_birth: '',
    date_joined_staff: '',
    date_left_staff: '',
    email_address: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    line_1_number_building: '',
    city: '',
    zip_postcode: '',
    state_province_county: '',
    country: '',
    isActive: true,
  });

  const handleOpenModal = (staff?: any) => {
    if (staff) {
      setForm(staff);
      setEditingId(staff._id);
    } else {
      setForm({
        nickname: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        date_of_birth: '',
        date_joined_staff: '',
        date_left_staff: '',
        email_address: '',
        phone_number: '',
        password: '',
        confirmPassword: '',
        line_1_number_building: '',
        city: '',
        zip_postcode: '',
        state_province_county: '',
        country: '',
        isActive: true,
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match for new staff
    if (!editingId && form.password !== form.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    try {
      if (editingId) {
        await apiService.staff.update(editingId, form);
      } else {
        // First create the address if provided
        let addressId = null;
        if (form.line_1_number_building && form.city && form.zip_postcode) {
          const addressData = {
            line_1_number_building: form.line_1_number_building,
            city: form.city,
            zip_postcode: form.zip_postcode,
            state_province_county: form.state_province_county || '',
            country: form.country || '',
          };
          const addressResponse = await apiService.addresses.create(addressData);
          addressId = addressResponse.data.address_id;
        }
        
        // Then create staff with address_id
        const staffData = {
          ...form,
          staff_address_id: addressId,
        };
        // Remove confirmPassword and address fields before sending
        delete staffData.confirmPassword;
        delete staffData.line_1_number_building;
        delete staffData.city;
        delete staffData.zip_postcode;
        delete staffData.state_province_county;
        delete staffData.country;
        
        await apiService.staff.create(staffData);
      }
      refetch();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving staff:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error saving staff. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDelete = async (staff: any) => {
    if (window.confirm('Are you sure?')) {
      try {
        await apiService.staff.delete(staff._id);
        refetch();
      } catch (error) {
        console.error('Error deleting staff:', error);
      }
    }
  };

  const columns = [
    { key: 'staff_id', label: 'ID', sortable: true },
    { key: 'first_name', label: 'First Name', sortable: true },
    { key: 'last_name', label: 'Last Name', sortable: true },
    { key: 'nickname', label: 'Nickname', sortable: true },
    { key: 'date_joined_staff', label: 'Joined', sortable: true },
  ];

  if (loading) return (
    <div className="flex justify-center items-center py-16">
      <div className="text-gray-600 text-lg">Loading staff...</div>
    </div>
  );

  const activeStaff = data.filter((s: any) => s.isActive !== false).length;
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
        {data.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No staff members yet</p>
            <p className="text-sm">Click "Add Staff" to create your first staff member</p>
          </div>
        ) : (
          data.map((staff: any) => (
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
                  {staff.role || 'Staff'}
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
                  <p className="text-xs text-gray-500 font-medium mb-1">Username</p>
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

              {/* Date Hired */}
              {staff.date_hired && (
                <div className="bg-white rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-green-600" />
                    <span className="text-xs text-gray-500">Date Hired</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{staff.date_hired}</p>
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
                <button
                  onClick={() => handleDelete(staff)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <UserX size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Staff' : 'Add New Staff Member'}>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-green-600" />
                First Name *
              </label>
              <input type="text" placeholder="Enter first name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-green-600" />
                Middle Name
              </label>
              <input type="text" placeholder="Middle name" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-green-600" />
                Last Name *
              </label>
              <input type="text" placeholder="Enter last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Award size={16} className="text-green-600" />
                Nickname (Username) *
              </label>
              <input type="text" placeholder="Username for login" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-green-600" />
                Date of Birth
              </label>
              <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-green-600" />
                Date Joined
              </label>
              <input type="date" value={form.date_joined_staff} onChange={(e) => setForm({ ...form, date_joined_staff: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-green-600" />
                Date Left
              </label>
              <input type="date" value={form.date_left_staff} onChange={(e) => setForm({ ...form, date_left_staff: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Mail size={16} className="text-green-600" />
                Email Address *
              </label>
              <input type="email" placeholder="staff@example.com" value={form.email_address} onChange={(e) => setForm({ ...form, email_address: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Phone size={16} className="text-green-600" />
                Phone Number
              </label>
              <input type="tel" placeholder="(123) 456-7890" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" />
            </div>
          </div>
          
          {!editingId && (
            <>
              <div className="col-span-full">
                <h3 className="text-lg font-bold text-gray-800 mb-4 mt-6 pb-2 border-b-2 border-green-200 flex items-center gap-2">
                  <User size={20} className="text-green-600" />
                  Address Information
                </h3>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Address Line (Building/Street) *
                </label>
                <input
                  type="text"
                  placeholder="e.g., 123 Main Street, Apt 4B"
                  value={form.line_1_number_building || ''}
                  onChange={(e) => setForm({ ...form, line_1_number_building: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter city"
                    value={form.city || ''}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    ZIP/Postal Code *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter ZIP/postal code"
                    value={form.zip_postcode || ''}
                    onChange={(e) => setForm({ ...form, zip_postcode: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    State/Province/County
                  </label>
                  <input
                    type="text"
                    placeholder="Enter state/province/county"
                    value={form.state_province_county || ''}
                    onChange={(e) => setForm({ ...form, state_province_county: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    placeholder="Enter country"
                    value={form.country || ''}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
              </div>
              
              <div className="col-span-full">
                <h3 className="text-lg font-bold text-gray-800 mb-4 mt-6 pb-2 border-b-2 border-green-200 flex items-center gap-2">
                  <Lock size={20} className="text-green-600" />
                  Account Credentials
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Lock size={16} className="text-green-600" />
                    Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={form.password || ''}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Lock size={16} className="text-green-600" />
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={form.confirmPassword || ''}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                </div>
              </div>
            </>
          )}
          <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-teal-700 font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2">
            <UserCheck size={20} />
            {editingId ? 'Update Staff' : 'Add Staff Member'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
