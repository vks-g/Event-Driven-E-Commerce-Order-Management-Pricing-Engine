import Order, { type IOrder } from './orderModel';

class OrderRepository {
  async create(orderData: Partial<IOrder>): Promise<IOrder> {
    const order = new Order(orderData);
    return order.save();
  }

  async findById(id: string): Promise<IOrder | null> {
    return Order.findById(id);
  }

  async findByIdAndUpdate(id: string, updateData: Partial<IOrder>): Promise<IOrder | null> {
    return Order.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async findAll(): Promise<IOrder[]> {
    return Order.find().sort({ createdAt: -1 });
  }
}

export default new OrderRepository();
