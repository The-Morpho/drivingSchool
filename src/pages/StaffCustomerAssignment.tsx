import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Modal } from '../components/Modal';
import { Plus, Trash2, Users, UserCheck, TrendingUp, CheckCircle, AlertCircle, Calendar, MapPin } from 'lucide-react';

interface StaffCustomer {
  assignment_id: number;
  staff_id: number;
  staff_name: string;
  customer_id: number;
  customer_name: string;
  city: string; // Changed from address_id to city
  assigned_date: string;
}

interface Staff {
  staff_id: number;
  first_name: string;
  last_name: string;
  nickname: string;
}

interface Customer {
  customer_id: number;
  first_name: string;
  last_name: string;
  email_address: string;
}

export const StaffCustomerAssignment: React.FC = () => {
  const [assignments, setAssignments] = useState<StaffCustomer[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [city, setCity] = useState<string>('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignRes, staffRes] = await Promise.all([
        apiService.assignments.getAll(),
        apiService.staff.getAll()
      ]);
      
      setAssignments(assignRes.data.assignments || []);
      setStaffList(staffRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // When staff is selected, fetch available customers in their city
  const handleStaffChange = async (staffId: string) => {
    setSelectedStaff(staffId);
    setSelectedCustomers([]); // Reset selected customers
    setAvailableCustomers([]); // Reset available customers
    setCity('');

    if (!staffId) return;

    try {
      setLoadingCustomers(true);
      const response = await apiService.assignments.getCustomersByStaffAddress(staffId);
      setAvailableCustomers(response.data.available_customers || []);
      setCity(response.data.city || '');
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert('Failed to load customers for this staff member');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleAssignCustomers = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStaff || selectedCustomers.length === 0) {
      alert('Please select staff and at least one customer');
      return;
    }

    if (!city) {
      alert('Staff city could not be determined');
      return;
    }

    try {
      await apiService.assignments.create({
        staff_id: parseInt(selectedStaff),
        customer_ids: selectedCustomers,
        city: city,
        notes: 'Assigned from manager dashboard'
      });

      alert('Customers assigned successfully!');
      fetchData();
      setIsModalOpen(false);
      setSelectedStaff('');
      setSelectedCustomers([]);
      setCity('');
      setAvailableCustomers([]);
    } catch (error) {
      console.error('Error assigning customers:', error);
      alert('Failed to assign customers');
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    try {
      await apiService.assignments.delete(assignmentId.toString());
      alert('Assignment removed successfully');
      fetchData();
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert('Failed to remove assignment');
    }
  };

  const toggleCustomer = (customerId: number) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const uniqueStaff = new Set(assignments.map(a => a.staff_id)).size;
  const uniqueCustomers = new Set(assignments.map(a => a.customer_id)).size;
  const recentAssignments = assignments.filter(a => {
    const assignDate = new Date(a.assigned_date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return assignDate > sevenDaysAgo;
  }).length;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Staff-Customer Assignments</h1>
            <p className="text-teal-100">Manage instructor and customer relationships</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-teal-600 px-6 py-3 rounded-xl hover:bg-teal-50 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 hover:scale-105"
          >
            <Plus size={22} />
            New Assignment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-600 text-sm font-medium mb-1">Total Assignments</p>
              <p className="text-3xl font-bold text-teal-900">{assignments.length}</p>
            </div>
            <div className="bg-teal-200 p-3 rounded-xl">
              <Users className="text-teal-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium mb-1">Active Staff</p>
              <p className="text-3xl font-bold text-blue-900">{uniqueStaff}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <UserCheck className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium mb-1">Assigned Customers</p>
              <p className="text-3xl font-bold text-purple-900">{uniqueCustomers}</p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <Users className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium mb-1">Recent (7 days)</p>
              <p className="text-3xl font-bold text-green-900">{recentAssignments}</p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Assignments Grid - Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <UserCheck size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No assignments yet</p>
            <p className="text-sm">Click "New Assignment" to create your first assignment</p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.assignment_id} className="border-l-4 border-teal-400 bg-teal-50 rounded-xl shadow-md hover:shadow-xl transition-all p-6 space-y-4">
              {/* Header with ID */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-teal-100 p-2 rounded-lg">
                    <UserCheck className="text-teal-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Assignment ID</p>
                    <p className="text-lg font-bold text-gray-900">#{assignment.assignment_id}</p>
                  </div>
                </div>
              </div>

              {/* Staff Name */}
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck size={14} className="text-teal-600" />
                  <p className="text-xs text-gray-500 font-medium">Staff Member</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{assignment.staff_name}</p>
              </div>

              {/* Customer Name */}
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={14} className="text-teal-600" />
                  <p className="text-xs text-gray-500 font-medium">Customer</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{assignment.customer_name}</p>
              </div>

              {/* City */}
              {assignment.city && (
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-teal-600" />
                    <p className="text-xs text-gray-500 font-medium">City</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{assignment.city}</p>
                </div>
              )}

              {/* Assigned Date */}
              <div className="bg-white rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-teal-600" />
                  <span className="text-xs text-gray-500">Assigned Date</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(assignment.assigned_date).toLocaleDateString()}
                </p>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-gray-200">
                <button
                  onClick={() => handleRemoveAssignment(assignment.assignment_id)}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Remove Assignment
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Customers to Staff"
      >
        <form onSubmit={handleAssignCustomers} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* Staff Selection */}
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700 flex items-center gap-2">
              <UserCheck size={16} className="text-teal-600" />
              Select Staff Member *
            </label>
            <select
              value={selectedStaff}
              onChange={(e) => handleStaffChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              required
            >
              <option value="">-- Select Staff --</option>
              {staffList.map(staff => (
                <option key={staff.staff_id} value={staff.staff_id}>
                  {staff.first_name} {staff.last_name} ({staff.nickname})
                </option>
              ))}
            </select>
          </div>

          {/* City Info */}
          {city && (
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-xl border border-teal-200 flex items-center gap-2">
              <CheckCircle className="text-teal-600" size={20} />
              <div>
                <p className="text-teal-900 font-semibold text-sm">Staff City Located</p>
                <p className="text-teal-700 text-xs">City: {city}</p>
              </div>
            </div>
          )}

          {/* Customers Selection */}
          {selectedStaff && (
            <div>
              <label className="block text-sm font-bold mb-3 text-gray-700 flex items-center gap-2">
                <Users size={16} className="text-teal-600" />
                Select Customers in this City *
              </label>
              {loadingCustomers ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
                  <p className="mt-2 text-gray-600 font-semibold">Loading customers...</p>
                </div>
              ) : availableCustomers.length === 0 ? (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex items-center gap-2">
                  <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-yellow-700 font-medium">
                    No available customers in this staff member's city
                  </p>
                </div>
              ) : (
                <div className="border-2 border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto space-y-2">
                  {availableCustomers.map(customer => (
                    <label key={customer.customer_id} className="flex items-center p-3 hover:bg-teal-50 rounded-lg cursor-pointer transition-all border border-transparent hover:border-teal-200">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.customer_id)}
                        onChange={() => toggleCustomer(customer.customer_id)}
                        className="mr-3 w-5 h-5 cursor-pointer accent-teal-600"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">
                          {customer.first_name} {customer.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{customer.email_address}</p>
                      </div>
                      {selectedCustomers.includes(customer.customer_id) && (
                        <CheckCircle className="text-teal-600" size={18} />
                      )}
                    </label>
                  ))}
                </div>
              )}
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <p className="text-sm font-bold text-blue-900">
                  {selectedCustomers.length} customer(s) selected
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedStaff || selectedCustomers.length === 0}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 rounded-xl hover:from-teal-700 hover:to-cyan-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 disabled:hover:scale-100"
          >
            <Users size={20} />
            Assign {selectedCustomers.length > 0 ? `${selectedCustomers.length} ` : ''}Customer{selectedCustomers.length !== 1 ? 's' : ''}
          </button>
        </form>
      </Modal>
    </div>
  );
};
