import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';
import { Modal } from '../components/Modal';
import { Plus, Truck, Car, FileText, Calendar, CheckCircle, Trash2 } from 'lucide-react';

interface VehicleForm {
  vehicle_name: string;
  vehicle_model: string;
  vehicle_details: string;
}

export const Vehicles: React.FC = () => {
  const { data, loading, refetch } = useFetch(() => apiService.vehicles.getAll());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleForm>({ 
    vehicle_name: '',
    vehicle_model: '',
    vehicle_details: '' 
  });

  const handleOpenModal = (vehicle?: any) => {
    if (vehicle) {
      setForm(vehicle);
      setEditingId(vehicle._id);
    } else {
      setForm({ 
        vehicle_name: '',
        vehicle_model: '',
        vehicle_details: '' 
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiService.vehicles.update(editingId, form);
      } else {
        await apiService.vehicles.create(form);
      }
      refetch();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };

  const handleDelete = async (vehicle: any) => {
    if (window.confirm('Are you sure?')) {
      try {
        await apiService.vehicles.delete(vehicle._id);
        refetch();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-16">
      <div className="text-gray-600 text-lg">Loading vehicles...</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="relative flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Vehicle Fleet</h1>
            <p className="text-indigo-100">Manage your driving school vehicles</p>
          </div>
          <button onClick={() => handleOpenModal()} className="bg-white text-indigo-600 px-6 py-3 rounded-xl hover:bg-indigo-50 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 hover:scale-105">
            <Plus size={22} />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-600 text-sm font-medium mb-1">Total Vehicles</p>
              <p className="text-3xl font-bold text-indigo-900">{data.length}</p>
            </div>
            <div className="bg-indigo-200 p-3 rounded-xl">
              <Truck className="text-indigo-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium mb-1">Fleet Status</p>
              <p className="text-3xl font-bold text-purple-900">Active</p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <Car className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles Grid - Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Car size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No vehicles yet</p>
            <p className="text-sm">Click "Add Vehicle" to add your first vehicle</p>
          </div>
        ) : (
          data.map((vehicle: any) => (
            <div key={vehicle._id} className="border-l-4 border-indigo-400 bg-indigo-50 rounded-xl shadow-md hover:shadow-xl transition-all p-6 space-y-4">
              {/* Header with ID */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Car className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Vehicle ID</p>
                    <p className="text-lg font-bold text-gray-900">#{vehicle.vehicle_id}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Name */}
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 font-medium mb-1">Vehicle Name</p>
                <p className="text-xl font-bold text-gray-900">{vehicle.vehicle_name}</p>
              </div>

              {/* Model */}
              {vehicle.vehicle_model && (
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-medium mb-1">Model</p>
                  <p className="text-sm font-semibold text-gray-700">{vehicle.vehicle_model}</p>
                </div>
              )}

              {/* Vehicle Details */}
              {vehicle.vehicle_details && (
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-medium mb-1">Details</p>
                  <p className="text-sm text-gray-700">{vehicle.vehicle_details}</p>
                </div>
              )}

              {/* Date Added */}
              {vehicle.date_added && (
                <div className="bg-white rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-600" />
                    <span className="text-xs text-gray-500">Date Added</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{vehicle.date_added}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => handleOpenModal(vehicle)}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(vehicle)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Vehicle' : 'Add New Vehicle'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Car size={16} className="text-indigo-600" />
                Vehicle Name *
              </label>
              <input 
                type="text" 
                placeholder="e.g., Toyota Corolla" 
                value={form.vehicle_name} 
                onChange={(e) => setForm({ ...form, vehicle_name: e.target.value })} 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Truck size={16} className="text-indigo-600" />
                Vehicle Model *
              </label>
              <input 
                type="text" 
                placeholder="e.g., 2023 LE" 
                value={form.vehicle_model} 
                onChange={(e) => setForm({ ...form, vehicle_model: e.target.value })} 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                required 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-indigo-600" />
              Vehicle Details *
            </label>
            <textarea 
              placeholder="Enter vehicle details (make, model, year, license plate, etc.)" 
              value={form.vehicle_details} 
              onChange={(e) => setForm({ ...form, vehicle_details: e.target.value })} 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none" 
              required 
              rows={5} 
            />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2">
            <Truck size={20} />
            {editingId ? 'Update Vehicle' : 'Add Vehicle'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
