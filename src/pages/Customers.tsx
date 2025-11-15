import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';
import { Modal } from '../components/Modal';
import { Plus, Users, TrendingUp, UserX, CheckCircle, User, Mail, Phone, Calendar, CreditCard, Lock } from 'lucide-react';  interface CustomerForm {
    customer_id?: number;
    customer_address_id?: number;
    customer_status_code: string;
    date_became_customer: string;
    date_of_birth: string;
    first_name: string;
    last_name: string;
    amount_outstanding: number;
    email_address: string;
    phone_number: string;
    cell_mobile_phone_number: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    line_1_number_building?: string;
    city?: string;
    zip_postcode?: string;
    state_province_county?: string;
    country?: string;
    isActive?: boolean;
  }

  export const Customers: React.FC = () => {
    const { data, loading, refetch } = useFetch(() => apiService.customers.getAll());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CustomerForm>({
      customer_status_code: 'Active',
      date_became_customer: '',
      date_of_birth: '',
      first_name: '',
      last_name: '',
      amount_outstanding: 0,
      email_address: '',
      phone_number: '',
      cell_mobile_phone_number: '',
      username: '',
      password: '',
      confirmPassword: '',
      line_1_number_building: '',
      city: '',
      zip_postcode: '',
      state_province_county: '',
      country: '',
      isActive: true,
    });

    const handleOpenModal = (customer?: any) => {
      if (customer) {
        setForm(customer);
        setEditingId(customer._id);
      } else {
        // Auto-populate date_became_customer with today's date
        const today = new Date().toISOString().split('T')[0];
        setForm({
          customer_status_code: 'Active',
          date_became_customer: today,
          date_of_birth: '',
          first_name: '',
          last_name: '',
          amount_outstanding: 0,
          email_address: '',
          phone_number: '',
          cell_mobile_phone_number: '',
          username: '',
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
      
      // Validate passwords match for new customers
      if (!editingId && form.password !== form.confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      
      try {
        if (editingId) {
          await apiService.customers.update(editingId, form);
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
          
          // Then create customer with address_id
          const customerData = {
            ...form,
            customer_address_id: addressId,
          };
          // Remove confirmPassword and address fields before sending
          delete customerData.confirmPassword;
          delete customerData.line_1_number_building;
          delete customerData.city;
          delete customerData.zip_postcode;
          delete customerData.state_province_county;
          delete customerData.country;
          
          await apiService.customers.create(customerData);
        }
        refetch();
        setIsModalOpen(false);
      } catch (error: any) {
        console.error('Error saving customer:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Error saving customer. Please try again.';
        alert(errorMessage);
      }
    };

    const handleDelete = async (customer: any) => {
      if (window.confirm('Are you sure you want to delete this customer?')) {
        try {
          await apiService.customers.delete(customer._id);
          refetch();
        } catch (error) {
          console.error('Error deleting customer:', error);
        }
      }
    };

    if (loading) return (
      <div className="flex justify-center items-center py-16">
        <div className="text-gray-600 text-lg">Loading customers...</div>
      </div>
    );

    const activeAccounts = data.filter((c: any) => c.isActive !== false).length;
    const inactiveAccounts = data.filter((c: any) => c.isActive === false).length;
    const totalOutstanding = data.reduce((sum: number, c: any) => sum + (c.amount_outstanding || 0), 0);

    return (
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Customer Management</h1>
              <p className="text-blue-100">Manage your driving school customers and track their progress</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-50 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 hover:scale-105"
            >
              <Plus size={22} />
              Add Customer
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium mb-1">Total Customers</p>
                <p className="text-3xl font-bold text-blue-900">{data.length}</p>
              </div>
              <div className="bg-blue-200 p-3 rounded-xl">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium mb-1">Active Accounts</p>
                <p className="text-3xl font-bold text-green-900">{activeAccounts}</p>
              </div>
              <div className="bg-green-200 p-3 rounded-xl">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium mb-1">Inactive Accounts</p>
                <p className="text-3xl font-bold text-orange-900">{inactiveAccounts}</p>
              </div>
              <div className="bg-orange-200 p-3 rounded-xl">
                <UserX className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium mb-1">Outstanding</p>
                <p className="text-3xl font-bold text-purple-900">${totalOutstanding.toFixed(2)}</p>
              </div>
              <div className="bg-purple-200 p-3 rounded-xl">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Customers Grid - Card Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No customers yet</p>
              <p className="text-sm">Click "Add Customer" to create your first customer</p>
            </div>
          ) : (
            data.map((customer: any) => {
              const isActive = customer.isActive !== false;
              return (
                <div key={customer._id} className={`border-l-4 ${isActive ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'} rounded-xl shadow-md hover:shadow-xl transition-all p-6 space-y-4`}>
                  {/* Header with ID and Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <User className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Customer ID</p>
                        <p className="text-lg font-bold text-gray-900">#{customer.customer_id}</p>
                      </div>
                    </div>
                    <select
                      value={isActive ? 'true' : 'false'}
                      onChange={async (e) => {
                        const newStatus = e.target.value === 'true';
                        try {
                          await apiService.customers.update(customer._id, {
                            ...customer,
                            isActive: newStatus,
                          });
                          refetch();
                        } catch (error) {
                          console.error('Error updating status:', error);
                          alert('Failed to update account status');
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer focus:ring-2 ${
                        isActive 
                          ? 'bg-green-100 text-green-800 border-green-200 focus:ring-green-300' 
                          : 'bg-red-100 text-red-800 border-red-200 focus:ring-red-300'
                      }`}
                    >
                      <option value="true">✓ Active</option>
                      <option value="false">✗ Inactive</option>
                    </select>
                  </div>

                  {/* Customer Name */}
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium mb-1">Customer Name</p>
                    <p className="text-xl font-bold text-gray-900">{customer.first_name} {customer.last_name}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-white rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-blue-600" />
                      <p className="text-sm text-gray-700">{customer.email_address}</p>
                    </div>
                    {customer.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-blue-600" />
                        <p className="text-sm text-gray-700">{customer.phone_number}</p>
                      </div>
                    )}
                  </div>

                  {/* Date Info */}
                  <div className="grid grid-cols-2 gap-3">
                    {customer.date_of_birth && (
                      <div className="bg-white rounded-lg p-3 space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-blue-600" />
                          <span className="text-xs text-gray-500">Birth Date</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{customer.date_of_birth}</p>
                      </div>
                    )}
                    {customer.date_became_customer && (
                      <div className="bg-white rounded-lg p-3 space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-blue-600" />
                          <span className="text-xs text-gray-500">Joined</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{customer.date_became_customer}</p>
                      </div>
                    )}
                  </div>

                  {/* Outstanding Amount */}
                  {customer.amount_outstanding > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} className="text-purple-600" />
                          <span className="text-xs font-medium text-purple-700">Outstanding</span>
                        </div>
                        <p className="text-lg font-bold text-purple-900">${customer.amount_outstanding.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleOpenModal(customer)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(customer)}
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

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? 'Edit Customer' : 'Add New Customer'}
        >
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  First Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  Last Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Mail size={16} className="text-blue-600" />
                Email Address *
              </label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={form.email_address}
                onChange={(e) => setForm({ ...form, email_address: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>
            {!editingId && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  Username *
                </label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={form.username || ''}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Phone size={16} className="text-blue-600" />
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="Phone Number"
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Phone size={16} className="text-blue-600" />
                Cell/Mobile Phone
              </label>
              <input
                type="tel"
                placeholder="Cell/Mobile Phone"
                value={form.cell_mobile_phone_number}
                onChange={(e) => setForm({ ...form, cell_mobile_phone_number: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                Date of Birth
              </label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                Date Became Customer
              </label>
              <input
                type="date"
                value={form.date_became_customer}
                onChange={(e) => setForm({ ...form, date_became_customer: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-600" />
                Status
              </label>
              <select
                value={form.customer_status_code}
                onChange={(e) => setForm({ ...form, customer_status_code: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" />
                Amount Outstanding
              </label>
              <input
                type="number"
                placeholder="Amount Outstanding"
                value={form.amount_outstanding}
                onChange={(e) => setForm({ ...form, amount_outstanding: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            
            {!editingId && (
              <>
                <div className="col-span-full">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 mt-6 pb-2 border-b-2 border-blue-200 flex items-center gap-2">
                    <User size={20} className="text-blue-600" />
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                
                <div className="col-span-full">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 mt-6 pb-2 border-b-2 border-blue-200 flex items-center gap-2">
                    <Lock size={20} className="text-blue-600" />
                    Account Credentials
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Lock size={16} className="text-blue-600" />
                      Password *
                    </label>
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={form.password || ''}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Lock size={16} className="text-blue-600" />
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={form.confirmPassword || ''}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>
              </>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              {editingId ? 'Update Customer' : 'Create Customer'}
            </button>
          </form>
        </Modal>
      </div>
    );
  };
