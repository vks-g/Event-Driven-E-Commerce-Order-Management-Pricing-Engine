import mongoose, { Document, Model } from 'mongoose';

export interface IOrderItem {
  sku: string;
  name: string;
  quantity: number;
  basePrice: number;
  finalPrice: number;
}

export interface IOrder extends Document {
  items: IOrderItem[];
  status: string;
  totalPrice: number;
  subtotal: number;
  discountsApplied: unknown[];
  pricingStrategy: string;
  paymentId?: string;
  shippingId?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new mongoose.Schema<IOrderItem>(
  {
    sku: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    basePrice: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema<IOrder>(
  {
    items: [orderItemSchema],
    status: { type: String, required: true, default: 'PENDING' },
    totalPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    discountsApplied: [{ type: mongoose.Schema.Types.Mixed }],
    pricingStrategy: { type: String, default: 'RegularPricing' },
    paymentId: { type: String },
    shippingId: { type: String },
    idempotencyKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, createdAt: -1 });

const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);
export default Order;
