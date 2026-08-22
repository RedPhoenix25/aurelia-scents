import express from 'express';
import { readData, writeData } from '../db.js';

const router = express.Router();
const ORDERS_FILE = 'orders.json';
const PRODUCTS_FILE = 'products.json';

// GET all orders
router.get('/', (req, res) => {
  const { status, limit } = req.query;
  let orders = readData(ORDERS_FILE);

  if (status && status !== 'All') {
    orders = orders.filter(o => o.status.toLowerCase() === status.toLowerCase());
  }

  // Sort latest first
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (limit) {
    orders = orders.slice(0, parseInt(limit, 10));
  }

  res.json({ success: true, count: orders.length, orders });
});

// GET order tracking for customers (Safe public view)
router.get('/track/:query', (req, res) => {
  const query = (req.params.query || '').trim().toLowerCase();
  if (!query) {
    return res.status(400).json({ success: false, error: 'Order reference required' });
  }

  const orders = readData(ORDERS_FILE);
  const cleanPhoneQuery = query.replace(/[^0-9]/g, '');

  const order = orders.find(o => {
    if (o.id.toLowerCase() === query) return true;
    if (cleanPhoneQuery && cleanPhoneQuery.length >= 7 && o.customer?.phone) {
      const cleanOrderPhone = o.customer.phone.replace(/[^0-9]/g, '');
      if (cleanOrderPhone.includes(cleanPhoneQuery)) return true;
    }
    return false;
  });

  if (!order) {
    return res.status(404).json({ success: false, error: 'No order found matching this reference.' });
  }

  const publicTracking = {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    recipient: order.customer?.name || 'Customer',
    city: order.customer?.city || 'Enugu',
    state: order.customer?.state || 'Enugu State',
    items: (order.items || []).map(i => ({ name: i.name, size: i.size, quantity: i.quantity, price: i.price })),
    total: order.total,
    deliveryFee: order.deliveryFee,
    subtotal: order.subtotal,
    paymentMethod: order.paymentMethod
  };

  res.json({ success: true, tracking: publicTracking });
});

// GET single order (Admin / Internal)
router.get('/:id', (req, res) => {
  const orders = readData(ORDERS_FILE);
  const order = orders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  res.json({ success: true, order });
});

// POST create new order
router.post('/', (req, res) => {
  const { customer, items, paymentMethod, channel, subtotal, deliveryFee, total } = req.body;

  if (!customer || !customer.name || !customer.phone || !items || !items.length) {
    return res.status(400).json({ success: false, error: 'Customer details and cart items are required' });
  }

  const products = readData(PRODUCTS_FILE);
  const orders = readData(ORDERS_FILE);

  // Validate and decrement stock
  items.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    if (prod) {
      const qty = item.quantity || 1;
      prod.stock_quantity = Math.max(0, (prod.stock_quantity || 0) - qty);
      if (prod.stock_quantity === 0) {
        prod.stock_status = 'OUT_OF_STOCK';
      }
    }
  });

  // Save updated product stock
  writeData(PRODUCTS_FILE, products);

  // Generate unique order reference
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderId = `AS-ORD-${randomSuffix}`;

  const newOrder = {
    id: orderId,
    customer: {
      name: customer.name,
      phone: customer.phone,
      whatsapp: customer.whatsapp || customer.phone,
      address: customer.address || '',
      city: customer.city || 'Enugu',
      state: customer.state || 'Enugu State',
      notes: customer.notes || ''
    },
    items: items.map(item => ({
      productId: item.productId,
      name: item.name,
      size: item.size || '50ml',
      price: Number(item.price),
      quantity: Number(item.quantity || 1),
      image: item.image || ''
    })),
    subtotal: Number(subtotal),
    deliveryFee: Number(deliveryFee || 0),
    total: Number(total),
    paymentMethod: paymentMethod || 'pay_on_delivery',
    channel: channel || 'website',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  orders.unshift(newOrder);
  writeData(ORDERS_FILE, orders);

  res.status(201).json({ success: true, order: newOrder });
});

// PATCH update order status (Admin)
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid or missing status' });
  }

  const orders = readData(ORDERS_FILE);
  const index = orders.findIndex(o => o.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  orders[index].status = status;
  orders[index].updatedAt = new Date().toISOString();
  writeData(ORDERS_FILE, orders);

  res.json({ success: true, order: orders[index] });
});

export default router;
