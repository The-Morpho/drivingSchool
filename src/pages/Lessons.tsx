import React, { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';
import { Modal } from '../components/Modal';
import { Plus, AlertCircle, CheckCircle, Calendar, Clock, Award, Car, Users, UserCheck, Search, X } from 'lucide-react';

interface Staff {
  staff_id: number;
  nickname: string;
  first_name: string;
  last_name: string;
}

interface Customer {
  customer_id: number;
  first_name: string;
  last_name: string;
  email_address: string;
}

interface Vehicle {
  vehicle_id: number;
  vehicle_name: string;
  vehicle_model: string;
  vehicle_details: string;
}

interface LessonForm {
  staff_id: number | null;
  customer_id: number | null;
  vehicle_id: number | null;
  lesson_date: string;
  lesson_time: string;
  lesson_duration: string;
  lesson_status?: string;
  price?: number;
}

export const Lessons: React.FC = () => {
  const { data, loading, refetch } = useFetch(() => apiService.lessons.getAll());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  // Get user role on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role?.toLowerCase() || '');
    }
  }, []);
  
  // Direct lesson creation states
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [form, setForm] = useState<LessonForm>({
    staff_id: null,
    customer_id: null,
    vehicle_id: null,
    lesson_date: '',
    lesson_time: '',
    lesson_duration: '1',
    price: 50, // Default lesson price
  });

  // Filter states
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    instructor: 'all',
    customer: 'all',
    vehicle: 'all'
  });
  const [filteredData, setFilteredData] = useState<any[]>([]);

  // Load staff and customers when modal opens for creation
  useEffect(() => {
    if (isModalOpen && !editingId) {
      loadStaffAndCustomers();
      loadVehicles();
    }
  }, [isModalOpen, editingId]);

  // Filter data when filters or data change
  useEffect(() => {
    if (!data) return;

    // Backend already filters lessons by role, so use data directly
    let base = [...data];

    let filtered = base;
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(lesson => {
        const customerName = lesson.customer ? `${lesson.customer.first_name} ${lesson.customer.last_name}`.toLowerCase() : '';
        const instructorName = lesson.staff ? `${lesson.staff.first_name} ${lesson.staff.last_name}`.toLowerCase() : '';
        const vehicleName = lesson.vehicle?.vehicle_name?.toLowerCase() || '';
        const vehicleModel = lesson.vehicle?.vehicle_model?.toLowerCase() || '';
        const vehicleDetails = lesson.vehicle?.vehicle_details?.toLowerCase() || '';
        const lessonId = lesson.lesson_id?.toString() || '';
        
        return customerName.includes(searchTerm) ||
               instructorName.includes(searchTerm) ||
               vehicleName.includes(searchTerm) ||
               vehicleModel.includes(searchTerm) ||
               vehicleDetails.includes(searchTerm) ||
               lessonId.includes(searchTerm);
      });
    }
    
    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(lesson => (lesson.lesson_status || 'Scheduled') === filters.status);
    }
    
    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(lesson => lesson.lesson_date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(lesson => lesson.lesson_date <= filters.dateTo);
    }
    
    // Instructor filter
    if (filters.instructor !== 'all') {
      filtered = filtered.filter(lesson => lesson.staff_id?.toString() === filters.instructor);
    }
    
    // Customer filter
    if (filters.customer !== 'all') {
      filtered = filtered.filter(lesson => lesson.customer_id?.toString() === filters.customer);
    }
    
    // Vehicle filter
    if (filters.vehicle !== 'all') {
      filtered = filtered.filter(lesson => lesson.vehicle_id?.toString() === filters.vehicle);
    }
    
    setFilteredData(filtered);
  }, [data, filters]);

  // Load staff and customers separately
  const loadStaffAndCustomers = async () => {
    try {
      const response = await apiService.lessons.getAssignmentsForCreation();
      setStaffList(response.data?.staff || []);
      setCustomerList(response.data?.customers || []);
    } catch (error) {
      console.error('Error loading staff and customers:', error);
      setErrorMessage('Failed to load staff and customers');
    }
  };

  // Load vehicles
  const loadVehicles = async () => {
    try {
      const response = await apiService.vehicles.getAll();
      setVehicles((response.data || []) as Vehicle[]);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setErrorMessage('Failed to load vehicles');
    }
  };

  

  const handleOpenModal = (lesson?: any) => {
    if (lesson) {
      setForm({
        staff_id: lesson.staff_id || null,
        customer_id: lesson.customer_id || null,
        vehicle_id: lesson.vehicle_id || null,
        lesson_date: lesson.lesson_date || '',
        lesson_time: lesson.lesson_time || '',
        lesson_duration: lesson.lesson_duration || '1',
        lesson_status: lesson.lesson_status || 'Scheduled',
        price: lesson.price || 50,
      });
      setEditingId(lesson._id);
    } else {
      setForm({
        staff_id: null,
        customer_id: null,
        vehicle_id: null,
        lesson_date: '',
        lesson_time: '',
        lesson_duration: '1',
        price: 50,
      });
      setSelectedStaff(null);
      setSelectedCustomer(null);
      setEditingId(null);
      setSuccessMessage(null);
      setErrorMessage(null);
    }
    setIsModalOpen(true);
  };

  const handleStaffChange = (staffId: number) => {
    const staff = staffList.find(s => s.staff_id === staffId) || null;
    setSelectedStaff(staff);
    setForm({ ...form, staff_id: staffId });
  };

  const handleCustomerChange = (customerId: number) => {
    const customer = customerList.find(c => c.customer_id === customerId) || null;
    setSelectedCustomer(customer);
    setForm({ ...form, customer_id: customerId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!editingId && (!form.staff_id || !form.customer_id)) {
      setErrorMessage('Please select both instructor and customer');
      return;
    }

    if (!form.vehicle_id) {
      setErrorMessage('Please select a vehicle');
      return;
    }

    if (!form.lesson_date) {
      setErrorMessage('Please select a date');
      return;
    }

    if (!form.lesson_time) {
      setErrorMessage('Please select a time');
      return;
    }

    try {
      if (editingId) {
        await apiService.lessons.update(editingId, {
          vehicle_id: form.vehicle_id,
          lesson_date: form.lesson_date,
          lesson_time: form.lesson_time,
          lesson_duration: form.lesson_duration,
          lesson_status: form.lesson_status,
        });
        setSuccessMessage('Lesson updated successfully!');
      } else {
        const response = await apiService.lessons.create({
          staff_id: form.staff_id,
          customer_id: form.customer_id,
          vehicle_id: form.vehicle_id,
          lesson_date: form.lesson_date,
          lesson_time: form.lesson_time,
          lesson_duration: form.lesson_duration,
          price: form.price,
        });

        setSuccessMessage('✅ Lesson created successfully!');
        
        setTimeout(() => {
          setIsModalOpen(false);
          refetch();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error saving lesson:', error);
      setErrorMessage(error.message || 'Error saving lesson');
    }
  };

  const handleDelete = async (lesson: any) => {
    if (window.confirm('Are you sure?')) {
      try {
        await apiService.lessons.delete(lesson._id);
        refetch();
      } catch (error) {
        console.error('Error deleting lesson:', error);
      }
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const displayData = filteredData.length > 0 || Object.values(filters).some(f => f !== '' && f !== 'all') ? filteredData : data;
  
  const upcomingLessons = displayData.filter((l: any) => {
    const lessonDate = new Date(l.lesson_date);
    return lessonDate > new Date();
  }).length;
  const completedLessons = displayData.filter((l: any) => l.lesson_status === 'Completed').length;
  const scheduledToday = displayData.filter((l: any) => {
    const lessonDate = new Date(l.lesson_date).toDateString();
    const today = new Date().toDateString();
    return lessonDate === today;
  }).length;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Lesson Management</h1>
            <p className="text-purple-100">Schedule and track driving lessons</p>
          </div>
          {(userRole === 'admin' || userRole === 'manager') && (
            <button onClick={() => handleOpenModal()} className="bg-white text-purple-600 px-6 py-3 rounded-xl hover:bg-purple-50 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 hover:scale-105">
              <Plus size={22} />
              Add Lesson
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium mb-1">Total Lessons</p>
              <p className="text-3xl font-bold text-purple-900">{displayData?.length || 0}</p>
              {displayData.length !== data?.length && (
                <p className="text-xs text-purple-500 mt-1">of {data?.length || 0} total</p>
              )}
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <Calendar className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-blue-900">{upcomingLessons}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <Clock className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-900">{completedLessons}</p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium mb-1">Today</p>
              <p className="text-3xl font-bold text-orange-900">{scheduledToday}</p>
            </div>
            <div className="bg-orange-200 p-3 rounded-xl">
              <Award className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Search size={20} className="text-purple-600" />
          <h3 className="font-semibold text-gray-800">Search Lessons</h3>
        </div>
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, instructor, vehicle, or lesson ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {filters.search && (
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredData.length} result(s) for "{filters.search}"
          </div>
        )}
      </div>

      {/* Lessons Grid - Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayData.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">
              {data?.length === 0 ? 'No lessons scheduled yet' : 'No lessons match your filters'}
            </p>
            <p className="text-sm">
              {data?.length === 0 ? 'Click "Add Lesson" to create your first lesson' : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          displayData.map((lesson: any) => {
            const status = lesson.lesson_status || 'Scheduled';
            const statusColors = {
              'Scheduled': 'border-blue-400 bg-blue-50',
              'Completed': 'border-green-400 bg-green-50',
              'Cancelled': 'border-red-400 bg-red-50',
              'In Progress': 'border-yellow-400 bg-yellow-50',
            };
            const statusBadgeColors = {
              'Scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
              'Completed': 'bg-green-100 text-green-800 border-green-200',
              'Cancelled': 'bg-red-100 text-red-800 border-red-200',
              'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            };
            const cardColor = statusColors[status as keyof typeof statusColors] || 'border-gray-400 bg-gray-50';
            const badgeColor = statusBadgeColors[status as keyof typeof statusBadgeColors] || 'bg-gray-100 text-gray-800 border-gray-200';

            return (
              <div key={lesson._id} className={`border-l-4 ${cardColor} rounded-xl shadow-md hover:shadow-xl transition-all p-6 space-y-4 relative group`}>
                {/* Header with ID and Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Lesson #{lesson.lesson_id || 'N/A'}
                    </h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
                      {status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handleOpenModal(lesson)}
                      className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(lesson)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Lesson Details */}
                <div className="space-y-3">
                  {/* Customer Information */}
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="text-purple-600" size={14} />
                      <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Customer</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {lesson.customer ? `${lesson.customer.first_name} ${lesson.customer.last_name}` : `Customer ID: ${lesson.customer_id}`}
                    </p>
                    {lesson.customer?.email_address && (
                      <p className="text-xs text-gray-600">{lesson.customer.email_address}</p>
                    )}
                  </div>

                  {/* Instructor Information */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck className="text-blue-600" size={14} />
                      <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Instructor</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {lesson.staff ? `${lesson.staff.first_name} ${lesson.staff.last_name}` : `Staff ID: ${lesson.staff_id}`}
                    </p>
                    {lesson.staff?.nickname && (
                      <p className="text-xs text-gray-600">@{lesson.staff.nickname}</p>
                    )}
                  </div>

                  {/* Vehicle Information */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="text-green-600" size={14} />
                      <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Vehicle</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {lesson.vehicle?.vehicle_name || lesson.vehicle?.vehicle_details || `Vehicle ID: ${lesson.vehicle_id}`}
                    </p>
                    {lesson.vehicle?.vehicle_model && (
                      <p className="text-xs text-gray-600">{lesson.vehicle.vehicle_model}</p>
                    )}
                  </div>

                  {/* Lesson Schedule */}
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                    <Calendar className="text-purple-600" size={16} />
                    <span className="text-sm text-gray-600">
                      {lesson.lesson_date} at {lesson.lesson_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="text-purple-600" size={16} />
                    <span className="text-sm text-gray-600">
                      {lesson.lesson_duration} hours
                    </span>
                  </div>
                  {lesson.price && (
                    <div className="flex items-center gap-3">
                      <Award className="text-purple-600" size={16} />
                      <span className="text-sm text-gray-600">
                        ${lesson.price}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Lesson' : 'Create New Lesson'}>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {errorMessage}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle size={20} />
              {successMessage}
            </div>
          )}

          {editingId ? (
            /* Edit Mode */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Car size={16} className="text-purple-600" />
                  Vehicle *
                </label>
                <select 
                  value={form.vehicle_id || ''} 
                  onChange={(e) => setForm({ ...form, vehicle_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                >
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      🚗 {v.vehicle_name} - {v.vehicle_model} (ID: {v.vehicle_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-purple-600" />
                  Date *
                </label>
                <input 
                  type="date" 
                  value={form.lesson_date} 
                  onChange={(e) => setForm({ ...form, lesson_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock size={16} className="text-purple-600" />
                  Time *
                </label>
                <input 
                  type="time" 
                  value={form.lesson_time} 
                  onChange={(e) => setForm({ ...form, lesson_time: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Award size={16} className="text-purple-600" />
                  Duration (hours) *
                </label>
                <input 
                  type="number" 
                  min="0.5" 
                  step="0.5" 
                  value={form.lesson_duration} 
                  onChange={(e) => setForm({ ...form, lesson_duration: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <CheckCircle size={16} className="text-purple-600" />
                  Status *
                </label>
                <select
                  value={form.lesson_status || 'Scheduled'}
                  onChange={(e) => setForm({ ...form, lesson_status: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2">
                <CheckCircle size={20} />
                Update Lesson
              </button>
            </form>
          ) : (
            /* Create Mode with Sequential Selection: Customer -> Instructor -> Vehicle */
            <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
              {/* Step 1: Select Customer */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Users size={16} className="text-purple-600" />
                  Step 1: Select Customer *
                </label>
                <select 
                  value={form.customer_id || ''} 
                  onChange={(e) => handleCustomerChange(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                >
                  <option value="">-- Choose a customer --</option>
                  {customerList.map(customer => (
                    <option key={customer.customer_id} value={customer.customer_id}>
                      {customer.first_name} {customer.last_name} ({customer.email_address})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Instructor */}
              {selectedCustomer && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <UserCheck size={16} className="text-purple-600" />
                    Step 2: Select Instructor *
                  </label>
                  <select 
                    value={form.staff_id || ''} 
                    onChange={(e) => handleStaffChange(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    required
                  >
                    <option value="">-- Choose an instructor --</option>
                    {staffList.map(staff => (
                      <option key={staff.staff_id} value={staff.staff_id}>
                        {staff.first_name} {staff.last_name} ({staff.nickname})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Step 3: Select Vehicle */}
              {selectedCustomer && selectedStaff && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Car size={16} className="text-purple-600" />
                    Step 3: Select Vehicle *
                  </label>
                  <select 
                    value={form.vehicle_id || ''} 
                    onChange={(e) => setForm({ ...form, vehicle_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    required
                  >
                    <option value="">-- Choose a vehicle --</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                        🚗 {vehicle.vehicle_name} - {vehicle.vehicle_model} ({vehicle.vehicle_details})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Lesson Details Section */}
              {form.vehicle_id && (
                <>
                  {/* Details Display */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200">
                    <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                      <CheckCircle size={18} />
                      Lesson Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-2">
                        <div>
                          <span className="font-bold text-gray-700">Customer:</span>
                          <p className="text-gray-900">{selectedCustomer?.first_name} {selectedCustomer?.last_name}</p>
                        </div>
                        <div>
                          <span className="font-bold text-gray-700">Email:</span>
                          <p className="text-gray-600">{selectedCustomer?.email_address}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="font-bold text-gray-700">Instructor:</span>
                          <p className="text-gray-900">{selectedStaff?.first_name} {selectedStaff?.last_name}</p>
                        </div>
                        <div>
                          <span className="font-bold text-gray-700">Nickname:</span>
                          <p className="text-gray-600">@{selectedStaff?.nickname}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="font-bold text-gray-700">Vehicle:</span>
                          <p className="text-gray-900">
                            {vehicles.find(v => v.vehicle_id === form.vehicle_id)?.vehicle_name || 'Vehicle name'}
                          </p>
                        </div>
                        <div>
                          <span className="font-bold text-gray-700">Model:</span>
                          <p className="text-gray-600">
                            {vehicles.find(v => v.vehicle_id === form.vehicle_id)?.vehicle_model || 'Model'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lesson Information */}
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <Calendar size={18} className="text-purple-600" />
                    Lesson Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Lesson Date *
                      </label>
                      <input
                        type="date"
                        value={form.lesson_date}
                        onChange={(e) => setForm({ ...form, lesson_date: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Lesson Time *
                      </label>
                      <input
                        type="time"
                        value={form.lesson_time}
                        onChange={(e) => setForm({ ...form, lesson_time: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Duration *
                      </label>
                      <select
                        value={form.lesson_duration}
                        onChange={(e) => setForm({ ...form, lesson_duration: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        required
                      >
                        <option value="0.5">30 minutes</option>
                        <option value="1">1 hour</option>
                        <option value="1.5">1.5 hours</option>
                        <option value="2">2 hours</option>
                        <option value="3">3 hours</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price || ''}
                        onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        placeholder="50.00"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-3 text-gray-600 bg-gray-200 rounded-xl hover:bg-gray-300 font-semibold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Create Lesson
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};