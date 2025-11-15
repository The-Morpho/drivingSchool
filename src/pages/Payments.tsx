import React, { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';
import { Modal } from '../components/Modal';
import { Plus, DollarSign, CreditCard, TrendingUp, AlertCircle, Users, Calendar, CheckCircle, Trash2 } from 'lucide-react';

interface PaymentForm {
  customer_id: number;
  datetime_payment: string;
  payment_method_code: string;
  amount_payment: number;
}

interface Customer {
  customer_id: number;
  first_name: string;
  last_name: string;
}

export const Payments: React.FC = () => {
  const { data, loading, refetch } = useFetch(() => apiService.payments.getAll());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<PaymentForm>({
    customer_id: 0,
    datetime_payment: '',
    payment_method_code: 'Cash',
    amount_payment: 0,
  });

  // Get current user role
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  // Fetch customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await apiService.customers.getAll();
        setCustomers(response.data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  const handleOpenModal = (payment?: any) => {
    if (payment) {
      setForm(payment);
      setEditingId(payment._id);
    } else {
      setForm({
        customer_id: 0,
        datetime_payment: '',
        payment_method_code: 'Cash',
        amount_payment: 0,
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiService.payments.update(editingId, form);
      } else {
        await apiService.payments.create(form);
      }
      refetch();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const handleDelete = async (payment: any) => {
    if (window.confirm('Are you sure?')) {
      try {
        await apiService.payments.delete(payment._id);
        refetch();
      } catch (error) {
        console.error('Error deleting payment:', error);
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-16">
      <div className="text-gray-600 text-lg">Loading payments...</div>
    </div>
  );

  const totalPayments = data.reduce((sum: number, p: any) => sum + (p.amount_payment || 0), 0);
  const cashPayments = data.filter((p: any) => p.payment_method_code === 'Cash').length;
  const cardPayments = data.filter((p: any) => p.payment_method_code === 'Card').length;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="relative flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Payment Management</h1>
            <p className="text-orange-100">Track customer payments and transactions</p>
          </div>
          {isManagerOrAdmin && (
            <button onClick={() => handleOpenModal()} className="bg-white text-orange-600 px-6 py-3 rounded-xl hover:bg-orange-50 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 hover:scale-105">
              <Plus size={22} />
              Add Payment
            </button>
          )}
        </div>
      </div>

      {/* Manager-Only Notice */}
      {!isManagerOrAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-blue-900 font-semibold text-sm">View Only Mode</p>
            <p className="text-blue-700 text-sm">Only managers and admins can add, edit, or delete payments.</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-orange-900">${totalPayments.toFixed(2)}</p>
            </div>
            <div className="bg-orange-200 p-3 rounded-xl">
              <DollarSign className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium mb-1">Cash Payments</p>
              <p className="text-3xl font-bold text-green-900">{cashPayments}</p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium mb-1">Card Payments</p>
              <p className="text-3xl font-bold text-blue-900">{cardPayments}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <CreditCard className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Payments Grid - Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No payments yet</p>
            <p className="text-sm">Payments will appear here once created</p>
          </div>
        ) : (
          data.map((payment: any) => (
            <div key={payment._id} className="border-l-4 border-orange-400 bg-orange-50 rounded-xl shadow-md hover:shadow-xl transition-all p-6 space-y-4">
              {/* Header with ID and Amount */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <DollarSign className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Payment ID</p>
                    <p className="text-lg font-bold text-gray-900">#{payment.payment_id}</p>
                  </div>
                </div>
                <div className="bg-orange-100 border border-orange-300 px-3 py-1 rounded-full">
                  <p className="text-2xl font-bold text-orange-900">${payment.payment_amount?.toFixed(2)}</p>
                </div>
              </div>

              {/* Customer Name */}
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={14} className="text-orange-600" />
                  <p className="text-xs text-gray-500 font-medium">Customer</p>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {payment.customer ? `${payment.customer.first_name} ${payment.customer.last_name}` : `ID: ${payment.customer_id}`}
                </p>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard size={14} className="text-orange-600" />
                  <p className="text-xs text-gray-500 font-medium">Payment Method</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{payment.payment_method || 'N/A'}</p>
              </div>

              {/* Payment Date */}
              {payment.payment_date && (
                <div className="bg-white rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-orange-600" />
                    <span className="text-xs text-gray-500">Payment Date</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{payment.payment_date}</p>
                </div>
              )}

              {/* Actions - Only for managers/admins */}
              {isManagerOrAdmin && (
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handleOpenModal(payment)}
                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(payment)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Payment' : 'Add New Payment'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Users size={16} className="text-orange-600" />
              Customer *
            </label>
            <select 
              value={form.customer_id} 
              onChange={(e) => setForm({ ...form, customer_id: parseInt(e.target.value) })} 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              required
            >
              <option value={0}>Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.customer_id} value={customer.customer_id}>
                  {customer.first_name} {customer.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-orange-600" />
              Payment Date & Time *
            </label>
            <input type="datetime-local" value={form.datetime_payment} onChange={(e) => setForm({ ...form, datetime_payment: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <CreditCard size={16} className="text-orange-600" />
              Payment Method *
            </label>
            <select value={form.payment_method_code} onChange={(e) => setForm({ ...form, payment_method_code: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all">
              <option value="Cash">💵 Cash</option>
              <option value="Card">💳 Card</option>
              <option value="Check">📝 Check</option>
              <option value="Transfer">🏦 Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign size={16} className="text-orange-600" />
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
              <input type="number" placeholder="0.00" step="0.01" value={form.amount_payment} onChange={(e) => setForm({ ...form, amount_payment: parseFloat(e.target.value) })} className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" required />
            </div>
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-amber-700 font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2">
            <DollarSign size={20} />
            {editingId ? 'Update Payment' : 'Add Payment'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
