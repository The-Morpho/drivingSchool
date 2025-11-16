import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';
import { Modal } from '../components/Modal';
import { Plus, Users, TrendingUp, UserX, CheckCircle, User, Mail, Phone, Calendar, CreditCard, Lock, Info } from 'lucide-react';

const getFreshPaymentState = () => ({
  amount_payment: null,
  payment_method_code: 'Cash',
  datetime_payment: new Date().toISOString().split('T')[0],
});

interface CustomerForm {
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
    username?: string;
    password?: string;
    confirmPassword?: string;
    line_1_number_building?: string;
    city?: string;
    zip_postcode?: string;
    state_province_county?: string;
    country?: string;
  }

  export const Customers: React.FC = () => {
    const { data, loading, refetch } = useFetch(() => apiService.customers.getAll());
    // local user/role detection
    const [currentUserRole, setCurrentUserRole] = useState<string>('');
    const [query, setQuery] = useState<string>('');

    // Lesson modal state
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerLessons, setCustomerLessons] = useState<any[]>([]);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
    const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
    const [newLesson, setNewLesson] = useState<{ date_time?: string; staff_id?: number | null; price?: number | null; lesson_duration?: string; vehicle_id?: number | null; lesson_status?: string }>({ date_time: '', staff_id: null, price: null, lesson_duration: '1', vehicle_id: null, lesson_status: 'Scheduled' });

    // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [newPayment, setNewPayment] = useState<{ amount_payment?: number | null; payment_method_code?: string; datetime_payment?: string }>(getFreshPaymentState);

    useEffect(() => {
      try {
        const u = localStorage.getItem('user');
        if (u) {
          const parsed = JSON.parse(u);
          const role = (parsed.role || parsed.userType || parsed.user_type || '').toString();
          setCurrentUserRole(role.toLowerCase());
        }
      } catch (e) {
        // ignore
      }
    }, []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CustomerForm>({
      customer_status_code: 'Active',
      date_became_customer: '',
      date_of_birth: '',
      first_name: '',
      last_name: '',
      amount_outstanding: 2500, // default outstanding for new customers
      email_address: '',
      phone_number: '',
      username: '',
      password: '',
      confirmPassword: '',
      line_1_number_building: '',
      city: '',
      zip_postcode: '',
      state_province_county: '',
      country: '',
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
          amount_outstanding: 2500, // default outstanding for new customers
          email_address: '',
          phone_number: '',
          username: '',
          password: '',
          confirmPassword: '',
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
      
      // Validate passwords match for new customers
      if (!editingId && form.password !== form.confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      
      try {
        // Build payload matching server models and controller expectations
        const phone = form.phone_number ||  '';

        const basePayload: any = {
          // Account fields (server will create Account)
          email_address: form.email_address,
          password: form.password,
          username: form.username || form.email_address,

          // Customer fields
          customer_status_code: form.customer_status_code,
          date_became_customer: form.date_became_customer,
          date_of_birth: form.date_of_birth,
          first_name: form.first_name,
          last_name: form.last_name,
          amount_outstanding: form.amount_outstanding,
          phone_number: phone,

          // Address fields (server will create Addresses and link)
          line_1_number_building: form.line_1_number_building,
          city: form.city,
          zip_postcode: form.zip_postcode,
          state_province_county: form.state_province_county,
          country: form.country,
        };

        // Remove empty password on update so it's not overwritten
        if (editingId) {
          // Build update payload - do not send password unless provided
          const updatePayload: any = {
            customer_status_code: basePayload.customer_status_code,
            date_became_customer: basePayload.date_became_customer,
            date_of_birth: basePayload.date_of_birth,
            first_name: basePayload.first_name,
            last_name: basePayload.last_name,
            amount_outstanding: basePayload.amount_outstanding,
            phone_number: basePayload.phone_number,
            // if address fields are present, include them so server may create/update address
            line_1_number_building: basePayload.line_1_number_building,
            city: basePayload.city,
            zip_postcode: basePayload.zip_postcode,
            state_province_county: basePayload.state_province_county,
            country: basePayload.country,
          };

          try {
            await apiService.customers.update(editingId, updatePayload);
          } catch (err) {
            throw err;
          }
        } else {
          // Creation: ensure confirmPassword is ignored and required fields are present
          const createPayload = { ...basePayload };
          delete createPayload.confirmPassword;

          await apiService.customers.create(createPayload);
        }
        refetch();
        setIsModalOpen(false);
      } catch (error: any) {
        console.error('Error saving customer:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Error saving customer. Please try again.';
        alert(errorMessage);
      }
    };

    // add delete confirmation state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // replace window.confirm usage: open modal first
    const initiateDelete = (customer: any) => {
      setCustomerToDelete(customer);
      setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
      if (!customerToDelete) return;
      setIsDeleting(true);
      try {
        await apiService.customers.delete(customerToDelete._id);
        refetch();
        setDeleteModalOpen(false);
        setCustomerToDelete(null);
      } catch (error: any) {
        console.error('Error deleting customer:', error);
        alert(error?.response?.data?.error || error?.message || 'Failed to delete customer');
      } finally {
        setIsDeleting(false);
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

    // Open lessons modal for a customer (manager only)
    const openLessonsForCustomer = async (customer: any) => {
      setSelectedCustomer(customer);
      setLessonModalOpen(true);

      try {
        const res = await apiService.lessons.getAll();
        const lessons = res.data || [];
        setCustomerLessons(lessons.filter((l: any) => l.customer_id === customer.customer_id));

        // load available staff/instructors in same city
        try {
          const staffRes = await apiService.lessons.getAvailableInstructors(customer.customer_id);
          setAvailableStaff(staffRes.data || []);
        } catch (err) {
          console.warn('Could not load available staff for customer', err);
          setAvailableStaff([]);
        }
        // try to load vehicles for selection
        try {
          const vehRes = await apiService.vehicles.getAll();
          setAvailableVehicles(vehRes.data || []);
        } catch (err) {
          console.warn('Could not load vehicles', err);
          setAvailableVehicles([]);
        }
      } catch (err) {
        console.error('Error loading lessons', err);
        setCustomerLessons([]);
      }
    };

    const handleCreateLesson = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!selectedCustomer) return alert('No customer selected');
      if (!newLesson.staff_id) return alert('Please select a staff/instructor');
      if (!newLesson.date_time) return alert('Please select a date and time');
      try {
        const [lessonDate, lessonTime] = newLesson.date_time.split('T');
        if (!lessonDate || !lessonTime) {
          return alert('Please select a valid lesson date and time');
        }
        const durationValue = newLesson.lesson_duration && newLesson.lesson_duration.trim() ? newLesson.lesson_duration : '1';
        const payload: any = {
          customer_id: selectedCustomer.customer_id,
          staff_id: newLesson.staff_id,
          lesson_date: lessonDate,
          lesson_time: lessonTime,
          lesson_status: newLesson.lesson_status || 'Scheduled',
          lesson_duration: durationValue,
        };
        if (newLesson.price) payload.price = newLesson.price;
        if (newLesson.vehicle_id) payload.vehicle_id = newLesson.vehicle_id;

        await apiService.lessons.create(payload);
        const res = await apiService.lessons.getAll();
        const lessons = res.data || [];
          setCustomerLessons(lessons.filter((l: any) => l.customer_id === selectedCustomer.customer_id));
          refetch();
        setNewLesson({ date_time: '', staff_id: null, price: null, lesson_duration: '1', vehicle_id: null, lesson_status: 'Scheduled' });
        alert('Lesson created');
      } catch (err: any) {
        console.error('Error creating lesson', err);
        alert(err.response?.data?.error || err.message || 'Failed to create lesson');
      }
    };

    // Open payment modal
    const openPaymentForCustomer = (customer: any) => {
      setSelectedCustomer(customer);
      setPaymentModalOpen(true);
      setNewPayment(getFreshPaymentState());
    };

    const handleCreatePayment = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!selectedCustomer) return alert('No customer selected');
      if (!newPayment.amount_payment || newPayment.amount_payment <= 0) return alert('Enter a valid payment amount');
      try {
        const payload: any = {
          customer_id: selectedCustomer.customer_id,
          amount_payment: newPayment.amount_payment,
          payment_method_code: newPayment.payment_method_code,
          datetime_payment: newPayment.datetime_payment,
        };
    await apiService.payments.create(payload);
    refetch();
    setPaymentModalOpen(false);
    setNewPayment(getFreshPaymentState());
        alert('Payment recorded');
      } catch (err: any) {
        console.error('Error creating payment', err);
        alert(err.response?.data?.error || err.message || 'Failed to create payment');
      }
    };

    if (loading) return (
      <div className="flex justify-center items-center py-16">
        <div className="text-gray-600 text-lg">Loading customers...</div>
      </div>
    );

    // Helper: derive boolean active state from customer_status_code only
    const getIsActive = (c: any) => {
      if (c == null) return true;
      const status = (c.customer_status_code || 'Active').toString().toLowerCase();
      return status !== 'inactive';
    };

    const activeAccounts = data.filter((c: any) => getIsActive(c)).length;
    const inactiveAccounts = data.filter((c: any) => !getIsActive(c)).length;
    const totalOutstanding = data.reduce((sum: number, c: any) => sum + (c.amount_outstanding || 0), 0);

    // filter data by search query (id, name, email, phone)
    const filteredData = (data || []).filter((c: any) => {
      if (!query || query.trim() === '') return true;
      const q = query.trim().toLowerCase();
      const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
      return (
        String(c.customer_id || '').toLowerCase().includes(q) ||
        fullName.includes(q) ||
        (c.email_address || '').toLowerCase().includes(q) ||
        (c.phone_number || '').toLowerCase().includes(q)
      );
    });

    return (
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Customer Management</h1>
              <p className="text-blue-100">Manage your driving school customers and track their progress</p>
              <div className="mt-4">
                <label className="sr-only" htmlFor="customer-search">Search customers</label>
                <div className="relative max-w-md">
                  <input
                    id="customer-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, email, phone or id..."
                    className="w-full px-4 py-2 rounded-lg text-gray-800 bg-white/90 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
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
          {filteredData.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              {data.length === 0 ? (
                <>
                  <p className="text-lg">No customers yet</p>
                  <p className="text-sm">Click "Add Customer" to create your first customer</p>
                </>
              ) : (
                <>
                  <p className="text-lg">No results for "{query}"</p>
                  <p className="text-sm">Try a different search or clear the filter</p>
                </>
              )}
            </div>
          ) : (
            filteredData.map((customer: any) => {
              const isActive = getIsActive(customer);
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
                    {/* Status select now uses customer_status_code */}
                    {(() => {
                      const statusVal = customer.customer_status_code || 'Active';
                      const isActiveStatus = (statusVal || '').toString().toLowerCase() !== 'inactive';
                      return (
                        <select
                          value={statusVal}
                          onChange={async (e) => {
                            const newStatus = e.target.value || 'Active';
                            try {
                              // Update customer_status_code on the server
                              await apiService.customers.update(customer._id, { customer_status_code: newStatus });
                              refetch();
                            } catch (error) {
                              console.error('Error updating status:', error);
                              alert('Failed to update account status');
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer focus:ring-2 ${
                            isActiveStatus
                              ? 'bg-green-100 text-green-800 border-green-200 focus:ring-green-300'
                              : 'bg-red-100 text-red-800 border-red-200 focus:ring-red-300'
                          }`}
                        >
                          <option value="Active">✓ Active</option>
                          <option value="Inactive">✗ Inactive</option>
                        </select>
                      );
                    })()}
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

                  {/* Actions: first row (Edit / Details / Delete), second row (Lessons / Payment) */}
                  <div className="pt-2 border-t border-gray-200 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(customer)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Edit
                      </button>

                      {currentUserRole === 'manager' ? (
                        <Link
                          to={`/customers/${customer._id}`}
                          className="flex-1 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <Info size={16} />
                          Details
                        </Link>
                      ) : (
                        // keep the space so layout remains consistent for non-managers
                        <div className="flex-1" />
                      )}

                      <button
                        onClick={() => initiateDelete(customer)}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                      >
                        <UserX size={16} />
                        Delete
                      </button>
                    </div>

                    {currentUserRole === 'manager' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openLessonsForCustomer(customer)}
                          className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <Users size={16} />
                          Lessons
                        </button>

                        <button
                          onClick={() => openPaymentForCustomer(customer)}
                          className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <CreditCard size={16} />
                          Payment
                        </button>
                      </div>
                    )}
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
                disabled={!editingId} // locked when creating new customers (server sets to $2500)
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
        {/* Lessons Modal (manager) */}
        <Modal
          isOpen={lessonModalOpen}
          onClose={() => setLessonModalOpen(false)}
          title={selectedCustomer ? `Lessons for ${selectedCustomer.first_name} ${selectedCustomer.last_name}` : 'Lessons'}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Existing Lessons</h4>
              {customerLessons.length === 0 ? (
                <p className="text-sm text-gray-500">No lessons found for this customer.</p>
              ) : (
                <ul className="space-y-2">
                  {customerLessons.map((l: any) => {
                    // derive display values: prefer lesson_date + lesson_time, fallback to date_time/date
                    const dateText = l.lesson_date
                      ? `${l.lesson_date}${l.lesson_time ? ' ' + (typeof l.lesson_time === 'string' ? l.lesson_time.slice(0,5) : l.lesson_time) : ''}`
                      : (l.date_time || l.date || '—');

                    // try to resolve staff name from availableStaff; fallback to staff_id
                    const staffObj = availableStaff.find((s: any) => s.staff_id === l.staff_id) || null;
                    const staffText = staffObj
                      ? `${(staffObj.first_name || '').trim()} ${(staffObj.last_name || '').trim()}`.trim() || staffObj.nickname || staffObj.staff_id
                      : (l.staff_id || 'N/A');

                    const priceText = (l.price || l.price === 0) ? (typeof l.price === 'number' ? `$${l.price.toFixed(2)}` : `$${l.price}`) : '';

                    return (
                      <li key={l._id} className="p-2 border rounded bg-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{dateText}</div>
                            <div className="text-xs text-gray-500">Instructor: {staffText}</div>
                          </div>
                          <div className="text-sm font-semibold">{priceText}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <hr />

            <form onSubmit={handleCreateLesson} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Date & time</label>
                <input
                  type="datetime-local"
                  value={newLesson.date_time || ''}
                  onChange={(e) => setNewLesson({ ...newLesson, date_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Instructor</label>
                <select
                  value={newLesson.staff_id ?? ''}
                  onChange={(e) => setNewLesson({ ...newLesson, staff_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select instructor</option>
                  {availableStaff.map((s: any) => (
                    <option key={s.staff_id} value={s.staff_id}>{s.first_name} {s.last_name} ({s.nickname || s.staff_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Vehicle</label>
                <select
                  value={newLesson.vehicle_id ?? ''}
                  onChange={(e) => setNewLesson({ ...newLesson, vehicle_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select vehicle (optional)</option>
                  {availableVehicles.map((v: any) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_name} {v.vehicle_model} ({v.vehicle_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  value={newLesson.lesson_status || 'Scheduled'}
                  onChange={(e) => setNewLesson({ ...newLesson, lesson_status: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Price (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newLesson.price ?? ''}
                  onChange={(e) => setNewLesson({ ...newLesson, price: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Duration (hours)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newLesson.lesson_duration ?? ''}
                  onChange={(e) => setNewLesson({ ...newLesson, lesson_duration: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setLessonModalOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">Create Lesson</button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Payment Modal (manager) */}
        <Modal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setNewPayment(getFreshPaymentState());
          }}
          title={selectedCustomer ? `Payment for ${selectedCustomer.first_name} ${selectedCustomer.last_name}` : 'Payment'}
        >
          <form onSubmit={handleCreatePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Amount</label>
              <input
                type="number"
                step="0.01"
                value={newPayment.amount_payment ?? ''}
                onChange={(e) => setNewPayment({ ...newPayment, amount_payment: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Payment Method</label>
              <select
                value={newPayment.payment_method_code}
                onChange={(e) => setNewPayment({ ...newPayment, payment_method_code: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Date</label>
              <input
                type="date"
                value={newPayment.datetime_payment || ''}
                onChange={(e) => setNewPayment({ ...newPayment, datetime_payment: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentModalOpen(false);
                  setNewPayment(getFreshPaymentState());
                }}
                className="px-4 py-2 rounded border"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white">Record Payment</button>
            </div>
          </form>
        </Modal>

        {/* Delete confirmation modal (replaces window.confirm) */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setCustomerToDelete(null);
          }}
          title="Confirm Delete"
        >
          <div className="space-y-4">
            <p>
              Are you sure you want to delete{' '}
              <strong>
                {customerToDelete?.first_name} {customerToDelete?.last_name}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setCustomerToDelete(null);
                }}
                className="px-4 py-2 rounded border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  };
