import mongoose from 'mongoose';

const customerPaymentSchema = new mongoose.Schema({
  customer_id: Number,
  datetime_payment: String,
  payment_method_code: String,
  amount_payment: Number,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual populate for customer
customerPaymentSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customer_id',
  foreignField: 'customer_id',
  justOne: true
});

export default mongoose.model('CustomerPayment', customerPaymentSchema, 'Customer_Payments');
