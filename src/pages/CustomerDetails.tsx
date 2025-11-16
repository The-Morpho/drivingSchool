import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { ArrowLeft, Calendar, CheckCircle, CreditCard, Users } from 'lucide-react';

const lessonStatusClass = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'scheduled':
      return 'bg-emerald-100 text-emerald-700';
    case 'completed':
      return 'bg-blue-100 text-blue-700';
    case 'cancelled':
    case 'canceled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const formatCurrency = (value?: number | string) => {
  if (value === null || value === undefined) return '-';
  const numeric = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numeric)) return '-';
  return `$${numeric.toFixed(2)}`;
};

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Customer id is missing');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      try {
        // Fetch required resources first (customer, lessons, payments).
        const [customerRes, lessonsRes, paymentsRes] = await Promise.all([
          apiService.customers.getById(id),
          apiService.lessons.getAll(),
          apiService.payments.getAll(),
        ]);

        // Fetch optional resources (staff, addresses, vehicles) but don't fail if missing
        const optional = await Promise.allSettled([
          apiService.staff.getAll(),
          apiService.addresses.getAll(),
          apiService.vehicles.getAll(),
        ]);

        const [staffResSettled, addressesResSettled, vehiclesResSettled] = optional;
        const staffRes = staffResSettled.status === 'fulfilled' ? staffResSettled.value : { data: [] };
        const addressesRes = addressesResSettled.status === 'fulfilled' ? addressesResSettled.value : { data: [] };
        const vehiclesRes = vehiclesResSettled.status === 'fulfilled' ? vehiclesResSettled.value : { data: [] };

        const customerData = customerRes.data;
        // build lookups for staff and addresses
        const staffList = staffRes.data || [];
        const staffById: Record<string | number, any> = (staffList || []).reduce((acc: any, s: any) => {
          if (s.staff_id != null) acc[s.staff_id] = s;
          if (s._id) acc[s._id] = s;
          return acc;
        }, {});

        const addressList = addressesRes.data || [];
        const addressById: Record<string | number, any> = (addressList || []).reduce((acc: any, a: any) => {
          if (a.address_id != null) acc[a.address_id] = a;
          if (a._id) acc[a._id] = a;
          return acc;
        }, {});

        const vehicleList = vehiclesRes.data || [];
        const vehicleById: Record<string | number, any> = (vehicleList || []).reduce((acc: any, v: any) => {
          if (v.vehicle_id != null) acc[v.vehicle_id] = v;
          if (v._id) acc[v._id] = v;
          return acc;
        }, {});

        // attach resolved address to customer if not already present
        if (!customerData.address) {
          const addr = addressById[customerData.customer_address_id];
          if (addr) customerData.address = addr;
        }

        setCustomer(customerData);

        const allLessons = lessonsRes.data || [];
        const lessonData = allLessons
          .filter((lesson: any) => lesson.customer_id === customerData.customer_id)
          .map((lesson: any) => {
            const resolved: any = { ...lesson };
            // try to attach instructor object
            const instructor = staffById[lesson.staff_id] || null;
            if (instructor) resolved.instructor = instructor;
            // try to attach instructor address
            if (instructor && instructor.staff_address_id) {
              resolved.instructorAddress = addressById[instructor.staff_address_id] || null;
            }
            // if lesson has a vehicle or other nested refs they can be resolved similarly
            if (lesson.vehicle_id) {
              resolved.vehicle = vehicleById[lesson.vehicle_id] || null;
            }
            return resolved;
          });
        setLessons(lessonData);

        const paymentData = (paymentsRes.data || []).filter(
          (payment: any) => payment.customer_id === customerData.customer_id,
        );
        setPayments(paymentData);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.error || err.message || 'Failed to load customer details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading customer details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/customers" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft size={16} /> Back to customers
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Link to="/customers" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft size={16} /> Back to customers
        </Link>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-700">
          Customer not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{customer.first_name} {customer.last_name}</h1>
          <p className="text-sm text-gray-500">Customer #{customer.customer_id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/customers"
            className="inline-flex items-center gap-2 px-4 py-2 border border-blue-200 rounded-lg text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            <ArrowLeft size={16} /> Back to list
          </Link>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            <CheckCircle size={14} />
            {customer.customer_status_code || 'Active'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Outstanding</p>
          <p className="text-2xl font-semibold text-gray-900">{formatCurrency(customer.amount_outstanding)}</p>
          <p className="text-xs text-gray-400">Amount owed</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Joined</p>
          <p className="text-lg font-semibold text-gray-900">{customer.date_became_customer || '—'}</p>
          <p className="text-xs text-gray-400">Customer since</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Lessons</p>
          <p className="text-lg font-semibold text-gray-900">{lessons.length}</p>
          <p className="text-xs text-gray-400">Planned or completed</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Contact</p>
              <h2 className="text-xl font-semibold text-gray-900">Personal info</h2>
            </div>
            <Users className="text-blue-600" size={20} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">{customer.email_address || '—'}</p>
                <Link to={`/customers/edit/${customer._id || customer.customer_id}`} className="text-xs text-blue-600 hover:underline">Edit</Link>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">{customer.phone_number || '—'}</p>
                <Link to={`/customers/edit/${customer._id || customer.customer_id}`} className="text-xs text-blue-600 hover:underline">Edit</Link>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">City</p>
              <p className="text-sm font-medium text-gray-900">{(customer.address && (customer.address.city || customer.address.line_1_number_building)) || customer.city || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Country</p>
              <p className="text-sm font-medium text-gray-900">{customer.address?.country || customer.country || '—'}</p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs text-gray-500">Account</p>
                  <h2 className="text-lg font-semibold text-gray-900">Security & status</h2>
                </div>
                <Link to={`/customers/edit/${customer._id || customer.customer_id}`} className="text-sm text-blue-600 hover:underline">Edit</Link>
              </div>
            </div>
            <LockIconCustom />
          </div>
          <div className="grid gap-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Username</span>
              <span className="font-medium text-gray-900">{customer.first_name || '—'}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Active</span>
              <span className="font-medium text-gray-900">{customer.isActive !== false ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Lessons</p>
            <h3 className="text-xl font-semibold text-gray-900">Scheduled & completed</h3>
          </div>
          <Calendar size={18} className="text-blue-500" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {lessons.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-gray-500">
              No lessons yet.
            </div>
          ) : (
            lessons.map((lesson) => (
              <div key={lesson._id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{lesson.lesson_date || lesson.date_time || '—'}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${lessonStatusClass(lesson.lesson_status)}`}>
                      {lesson.lesson_status || 'Planned'}
                    </span>
                    <Link to={`/lessons/edit/${lesson._id || lesson.lesson_id}`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Time: {lesson.lesson_time || lesson.date_time?.split('T')[1] || 'TBD'}</p>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Instructor</span>
                  <span className="font-medium text-gray-900">{(lesson.instructor && `${lesson.instructor.first_name || ''} ${lesson.instructor.last_name || ''}`) || lesson.staff_id || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Duration</span>
                  <span className="font-medium text-gray-900">{lesson.lesson_duration || '1'}h</span>
                </div>
                {lesson.instructorAddress && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{lesson.instructorAddress.line_1_number_building || ''}</p>
                    <p className="text-xs">{`${lesson.instructorAddress.city || ''}${lesson.instructorAddress.city ? ', ' : ''}${lesson.instructorAddress.country || ''}`}</p>
                  </div>
                )}
                {lesson.price && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Price</span>
                    <span className="font-medium text-gray-900">{formatCurrency(lesson.price)}</span>
                  </div>
                )}
                {lesson.vehicle && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">Vehicle: {lesson.vehicle.vehicle_name} {lesson.vehicle.vehicle_model}</p>
                    {lesson.vehicle.vehicle_details && <p className="text-xs text-gray-500">{lesson.vehicle.vehicle_details}</p>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Payments</p>
            <h3 className="text-xl font-semibold text-gray-900">Recorded transactions</h3>
          </div>
          <CreditCard size={18} className="text-green-600" />
        </div>
        <div className="space-y-3">
          {payments.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-gray-500">
              No payments recorded yet.
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment._id} className="flex flex-col gap-2 bg-white border border-gray-200 rounded-xl p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount_payment)}</p>
                    <Link to={`/payments/edit/${payment._id || payment.payment_id}`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                  </div>
                  <p className="text-xs text-gray-500">{payment.payment_method_code || 'Unknown method'}</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Date: {payment.datetime_payment || payment.createdAt || '—'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

const LockIconCustom: React.FC = () => (
  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border border-slate-100 text-slate-400">
    <LockIcon />
  </span>
);

const LockIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
