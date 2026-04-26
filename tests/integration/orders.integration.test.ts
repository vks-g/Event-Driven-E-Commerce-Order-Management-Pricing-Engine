import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app';

const TEST_SKU = 'INT-TEST-SKU-001';

beforeAll(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_test';
  await mongoose.connect(uri);

  await mongoose.connection.collection('inventories').deleteMany({ sku: TEST_SKU });
  await mongoose.connection.collection('inventories').insertOne({
    name: 'Integration Test Product',
    sku: TEST_SKU,
    basePrice: 100,
    category: 'test',
    stock: 50,
    reservedStock: 0,
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

afterAll(async () => {
  await mongoose.connection.collection('inventories').deleteMany({ sku: TEST_SKU });
  await mongoose.connection.close();
});

describe('Order Creation Flow', () => {
  let createdOrderId: string;

  it('POST /api/orders — creates an order with PENDING status', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        items: [{ sku: TEST_SKU, name: 'Integration Test Product', quantity: 2, basePrice: 100 }],
        strategy: 'RegularPricing',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.totalPrice).toBe(200);
    createdOrderId = res.body.data._id;
  });

  it('GET /api/orders/:id — retrieves the created order', async () => {
    const res = await request(app).get(`/api/orders/${createdOrderId}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(createdOrderId);
  });

  it('POST /api/orders/:id/cancel — cancels order and releases stock', async () => {
    const res = await request(app)
      .post(`/api/orders/${createdOrderId}/cancel`)
      .send({ reason: 'Integration test cancellation' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('GET /api/inventory/:sku — stock is released after cancellation', async () => {
    await new Promise((r) => setTimeout(r, 300));
    const res = await request(app).get(`/api/inventory/${TEST_SKU}`);
    expect(res.status).toBe(200);
    expect(res.body.data.reservedStock).toBe(0);
  });
});

describe('Idempotency', () => {
  it('POST /api/orders with same Idempotency-Key returns same order', async () => {
    const key = `test-idem-key-${Date.now()}`;

    const res1 = await request(app)
      .post('/api/orders')
      .set('Idempotency-Key', key)
      .send({
        items: [{ sku: TEST_SKU, name: 'Integration Test Product', quantity: 1, basePrice: 100 }],
        strategy: 'RegularPricing',
      });

    const res2 = await request(app)
      .post('/api/orders')
      .set('Idempotency-Key', key)
      .send({
        items: [{ sku: TEST_SKU, name: 'Integration Test Product', quantity: 1, basePrice: 100 }],
        strategy: 'RegularPricing',
      });

    expect(res1.body.data._id).toBe(res2.body.data._id);
  });
});

describe('Pricing Integration', () => {
  it('POST /api/pricing/calculate — returns correct total', async () => {
    const res = await request(app)
      .post('/api/pricing/calculate')
      .send({
        items: [{ sku: TEST_SKU, name: 'Test', quantity: 10, basePrice: 100 }],
        strategy: 'BulkPricing',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(950);
  });
});
