import React, { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { Plus, AlertCircle, CheckCircle, Calendar, Clock, Award, Car, Users, UserCheck } from 'lucide-react';

interface StaffGroup {
  staff_id: number;
  staff_name: string;
  email_address: string;
  phone_number: string;
  total_customers: number;
  customers: Customer[];
}

interface Customer {
  assignment_id: number;
  customer_id: number;
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number: string;
  address_id: number;
  address: string;
}

interface Vehicle {
  vehicle_id: number;
  vehicle_details: string;
}

interface LessonForm {
  assignment_id: number | null;
  vehicle_id: number | null;
  lesson_date: string;
  lesson_time: string;
  lesson_duration: string;
  lesson_status?: string;
}

export const Lessons: React.FC = () => {
  const { data, loading, refetch } = useFetch(() => apiService.lessons.getAll());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Grouped lesson creation states
  const [staffGroups, setStaffGroups] = useState<StaffGroup[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffGroup | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [form, setForm] = useState<LessonForm>({
    assignment_id: null,
    vehicle_id: null,
    lesson_date: '',
    lesson_time: '',
    lesson_duration: '1',
  });

  // Load staff with customers and vehicles when modal opens for creation
  useEffect(() => {
    if (isModalOpen && !editingId) {
      loadStaffWithCustomers();
      loadVehicles();
    }
  }, [isModalOpen, editingId]);

  // Load staff grouped with their customers
  const loadStaffWithCustomers = async () => {
    try {
      const response = await apiService.lessons.getStaffWithCustomers();
      setStaffGroups((response.data?.staff_groups || []) as StaffGroup[]);
    } catch (error) {
      console.error('Error loading staff:', error);
      setErrorMessage('Failed to load staff members');
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
        assignment_id: null,
        vehicle_id: lesson.vehicle_id || null,
        lesson_date: lesson.lesson_date || '',
        lesson_time: lesson.lesson_time || '',
        lesson_duration: lesson.lesson_duration || '1',
        lesson_status: lesson.lesson_status || 'Scheduled',
      });
      setEditingId(lesson._id);
    } else {
      setForm({
        assignment_id: null,
        vehicle_id: null,
        lesson_date: '',
        lesson_time: '',
        lesson_duration: '1',
        lesson_status: 'Scheduled',
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
    const staff = staffGroups.find(s => s.staff_id === staffId) || null;
    setSelectedStaff(staff);
    setSelectedCustomer(null); // Reset customer when staff changes
    setForm({ ...form, assignment_id: null });
  };

  const handleCustomerChange = (customerId: number) => {
    if (!selectedStaff) return;
    const customer = selectedStaff.customers.find(c => c.customer_id === customerId) || null;
    setSelectedCustomer(customer);
    if (customer) {
      setForm({ ...form, assignment_id: customer.assignment_id });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!editingId && !form.assignment_id) {
      setErrorMessage('Please select a customer');
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
          assignment_id: form.assignment_id,
          vehicle_id: form.vehicle_id,
          lesson_date: form.lesson_date,
          lesson_time: form.lesson_time,
          lesson_duration: form.lesson_duration,
        });

        setSuccessMessage(`✅ Lesson #${response.data?.lesson?.lesson_id} created successfully!`);
        
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

  const columns = [
    { key: 'lesson_id', label: 'ID', sortable: true },
    { 
      key: 'customer', 
      label: 'Customer', 
      sortable: true,
      render: (lesson: any) => lesson.customer ? `${lesson.customer.first_name} ${lesson.customer.last_name}` : `ID: ${lesson.customer_id}`
    },
    { 
      key: 'staff', 
      label: 'Instructor', 
      sortable: true,
      render: (lesson: any) => lesson.staff ? `${lesson.staff.first_name} ${lesson.staff.last_name}` : `ID: ${lesson.staff_id}`
    },
    { 
      key: 'vehicle', 
      label: 'Vehicle', 
      sortable: true,
      render: (lesson: any) => lesson.vehicle ? lesson.vehicle.vehicle_details : `ID: ${lesson.vehicle_id}`
    },
    { key: 'lesson_date', label: 'Date', sortable: true },
    { 
      key: 'lesson_status', 
      label: 'Status', 
      sortable: true,
      render: (lesson: any) => {
        const status = lesson.lesson_status || 'Scheduled';
        const colors = {
          'Scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
          'Completed': 'bg-green-100 text-green-800 border-green-200',
          'Cancelled': 'bg-red-100 text-red-800 border-red-200',
          'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        };
        const colorClass = colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
        return (
          <select
            value={status}
            onChange={async (e) => {
              try {
                await apiService.lessons.update(lesson._id, {
                  lesson_status: e.target.value,
                });
                refetch();
              } catch (error) {
                console.error('Error updating status:', error);
                alert('Failed to update status');
              }
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${colorClass} cursor-pointer focus:ring-2 focus:ring-purple-500`}
          >
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        );
      }
    },
  ];

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const upcomingLessons = data.filter((l: any) => {
    const lessonDate = new Date(l.lesson_date);
    return lessonDate > new Date();
  }).length;
  const completedLessons = data.filter((l: any) => l.lesson_status === 'Completed').length;
  const scheduledToday = data.filter((l: any) => {
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
          <button onClick={() => handleOpenModal()} className="bg-white text-purple-600 px-6 py-3 rounded-xl hover:bg-purple-50 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 hover:scale-105">
            <Plus size={22} />
            Add Lesson
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium mb-1">Total Lessons</p>
              <p className="text-3xl font-bold text-purple-900">{data.length}</p>
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

      {/* Lessons Grid - Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No lessons scheduled yet</p>
            <p className="text-sm">Click "Add Lesson" to create your first lesson</p>
          </div>
        ) : (
          data.map((lesson: any) => {
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
              <div key={lesson._id} className={`border-l-4 ${cardColor} rounded-xl shadow-md hover:shadow-xl transition-all p-6 space-y-4`}>
                {/* Header with ID and Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Calendar className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Lesson ID</p>
                      <p className="text-lg font-bold text-gray-900">#{lesson.lesson_id}</p>
                    </div>
                  </div>
                  <select
                    value={status}
                    onChange={async (e) => {
                      try {
                        await apiService.lessons.update(lesson._id, {
                          lesson_status: e.target.value,
                        });
                        refetch();
                      } catch (error) {
                        console.error('Error updating status:', error);
                        alert('Failed to update status');
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${badgeColor} cursor-pointer focus:ring-2 focus:ring-purple-500`}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Customer Info */}
                <div className="bg-white rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users size={16} className="text-purple-600" />
                    <span className="text-xs font-medium text-gray-500">Customer</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {lesson.customer ? `${lesson.customer.first_name} ${lesson.customer.last_name}` : `ID: ${lesson.customer_id}`}
                  </p>
                </div>

                {/* Instructor Info */}
                <div className="bg-white rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <UserCheck size={16} className="text-purple-600" />
                    <span className="text-xs font-medium text-gray-500">Instructor</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {lesson.staff ? `${lesson.staff.first_name} ${lesson.staff.last_name}` : `ID: ${lesson.staff_id}`}
                  </p>
                </div>

                {/* Vehicle Info */}
                <div className="bg-white rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Car size={16} className="text-purple-600" />
                    <span className="text-xs font-medium text-gray-500">Vehicle</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {lesson.vehicle ? lesson.vehicle.vehicle_details : `ID: ${lesson.vehicle_id}`}
                  </p>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-purple-600" />
                      <span className="text-xs font-medium text-gray-500">Date</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{lesson.lesson_date}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-purple-600" />
                      <span className="text-xs font-medium text-gray-500">Time</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{lesson.lesson_time || 'N/A'}</p>
                  </div>
                </div>

                {/* Duration */}
                {lesson.lesson_duration && (
                  <div className="bg-white rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Award size={14} className="text-purple-600" />
                      <span className="text-xs font-medium text-gray-500">Duration</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{lesson.lesson_duration} hour(s)</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handleOpenModal(lesson)}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(lesson)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <AlertCircle size={16} />
                    Delete
                  </button>
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
                      {v.vehicle_details}
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
                  Duration (hours)
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
            /* Create Mode with Grouped Selection */
            <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
              {/* Step 1: Select Staff */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <UserCheck size={16} className="text-purple-600" />
                  Step 1: Select Staff Member *
                </label>
                <select 
                  value={selectedStaff?.staff_id || ''} 
                  onChange={(e) => handleStaffChange(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                >
                  <option value="">-- Choose a staff member --</option>
                  {staffGroups.map(staff => (
                    <option key={staff.staff_id} value={staff.staff_id}>
                      {staff.staff_name} ({staff.total_customers} customers)
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Customer */}
              {selectedStaff && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Users size={16} className="text-purple-600" />
                    Step 2: Select Customer *
                  </label>
                  <select 
                    value={selectedCustomer?.customer_id || ''} 
                    onChange={(e) => handleCustomerChange(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  >
                    <option value="">-- Choose a customer --</option>
                    {selectedStaff.customers.map(customer => (
                      <option key={customer.customer_id} value={customer.customer_id}>
                        {customer.first_name} {customer.last_name} @ {customer.address}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Details Display */}
              {selectedCustomer && selectedStaff && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200">
                  <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                    <CheckCircle size={18} />
                    Lesson Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div>
                        <span className="font-bold text-gray-700">Instructor:</span>
                        <p className="text-gray-900">{selectedStaff.staff_name}</p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Email:</span>
                        <p className="text-gray-600">{selectedStaff.email_address}</p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Phone:</span>
                        <p className="text-gray-600">{selectedStaff.phone_number}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="font-bold text-gray-700">Customer:</span>
                        <p className="text-gray-900">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Email:</span>
                        <p className="text-gray-600">{selectedCustomer.email_address}</p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Phone:</span>
                        <p className="text-gray-600">{selectedCustomer.phone_number}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <span className="font-bold text-gray-700">Address:</span>
                    <p className="text-gray-600">{selectedCustomer.address}</p>
                  </div>
                </div>
              )}

              {/* Lesson Information */}
              {selectedCustomer && (
                <>
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <Calendar size={18} className="text-purple-600" />
                    Lesson Information
                  </h3>

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
                          {v.vehicle_details}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Award size={16} className="text-purple-600" />
                      Duration (hours)
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

                  <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2">
                    <Calendar size={20} />
                    Create Lesson
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
