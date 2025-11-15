import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { apiService } from '../services/api';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { Plus, MapPin, Map, Globe } from 'lucide-react';

interface AddressForm {
  address_id: number;
  line_1_number_building: string;
  city: string;
  zip_postcode: string;
  state_province_county: string;
  country: string;
}

export const Addresses: React.FC = () => {
  const { data, loading, refetch } = useFetch(() => apiService.addresses.getAll());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>({
    address_id: 0,
    line_1_number_building: '',
    city: '',
    zip_postcode: '',
    state_province_county: '',
    country: '',
  });

  const handleOpenModal = (address?: any) => {
    if (address) {
      setForm(address);
      setEditingId(address._id);
    } else {
      setForm({
        address_id: 0,
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
      if (editingId) {
        await apiService.addresses.update(editingId, form);
      } else {
        await apiService.addresses.create(form);
      }
      refetch();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const handleDelete = async (address: any) => {
    if (window.confirm('Are you sure?')) {
      try {
        await apiService.addresses.delete(address._id);
        refetch();
      } catch (error) {
        console.error('Error deleting address:', error);
      }
    }
  };

  const columns = [
    { key: 'address_id', label: 'ID', sortable: true },
    { key: 'line_1_number_building', label: 'Address', sortable: true },
    { key: 'city', label: 'City', sortable: true },
    { key: 'state_province_county', label: 'State', sortable: true },
    { key: 'country', label: 'Country', sortable: true },
  ];

  if (loading) return (
    <div className="flex justify-center items-center py-16">
      <div className="text-gray-600 text-lg">Loading addresses...</div>
    </div>
  );

  const uniqueCities = new Set(data.map((a: any) => a.city).filter(Boolean)).size;
  const uniqueStates = new Set(data.map((a: any) => a.state_province_county).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="relative flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Address Directory</h1>
            <p className="text-pink-100">Manage customer and staff addresses</p>
          </div>
          <button onClick={() => handleOpenModal()} className="bg-white text-pink-600 px-6 py-3 rounded-xl hover:bg-pink-50 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 hover:scale-105">
            <Plus size={22} />
            Add Address
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-600 text-sm font-medium mb-1">Total Addresses</p>
              <p className="text-3xl font-bold text-pink-900">{data.length}</p>
            </div>
            <div className="bg-pink-200 p-3 rounded-xl">
              <MapPin className="text-pink-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium mb-1">Cities</p>
              <p className="text-3xl font-bold text-purple-900">{uniqueCities}</p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <Map className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium mb-1">States/Regions</p>
              <p className="text-3xl font-bold text-blue-900">{uniqueStates}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <Globe className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <Table columns={columns} data={data} onEdit={handleOpenModal} onDelete={handleDelete} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Address' : 'Add Address'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Address ID</label>
            <input 
              type="number" 
              placeholder="Address ID" 
              value={form.address_id} 
              onChange={(e) => setForm({ ...form, address_id: parseInt(e.target.value) })} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
            <input 
              type="text" 
              placeholder="Street Address" 
              value={form.line_1_number_building} 
              onChange={(e) => setForm({ ...form, line_1_number_building: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
            <input 
              type="text" 
              placeholder="City" 
              value={form.city} 
              onChange={(e) => setForm({ ...form, city: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Zip/Postal Code</label>
            <input 
              type="text" 
              placeholder="Zip/Postal Code" 
              value={form.zip_postcode} 
              onChange={(e) => setForm({ ...form, zip_postcode: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">State/Province/County</label>
            <input 
              type="text" 
              placeholder="State/Province/County" 
              value={form.state_province_county} 
              onChange={(e) => setForm({ ...form, state_province_county: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
            <input 
              type="text" 
              placeholder="Country" 
              value={form.country} 
              onChange={(e) => setForm({ ...form, country: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition">Save Address</button>
        </form>
      </Modal>
    </div>
  );
};
