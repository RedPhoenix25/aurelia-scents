import express from 'express';
import { readData, writeData } from '../db.js';

const router = express.Router();

// Admin Authentication (Username & Password)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const settings = readData('settings.json');

  const validUser = settings.admin_username || 'admin';
  const validPass = settings.admin_password || 'aurelia2026';

  if (username === validUser && password === validPass) {
    const token = 'as_admin_auth_' + Buffer.from(`${username}:${Date.now()}`).toString('base64');
    return res.json({
      success: true,
      token,
      message: 'Authentication successful',
      user: { username }
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid username or password'
  });
});

// GET Admin Dashboard Statistics
router.get('/stats', (req, res) => {
  const products = readData('products.json');
  const orders = readData('orders.json');
  const settings = readData('settings.json');

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const processingOrders = orders.filter(o => o.status === 'Processing').length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
  
  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const totalProducts = products.length;
  const outOfStockCount = products.filter(p => p.stock_status === 'OUT_OF_STOCK' || p.stock_quantity === 0).length;
  const lowStockCount = products.filter(p => p.stock_status === 'IN_STOCK' && p.stock_quantity > 0 && p.stock_quantity <= 5).length;
  const inStockCount = products.filter(p => p.stock_status === 'IN_STOCK' && p.stock_quantity > 5).length;

  res.json({
    success: true,
    stats: {
      totalRevenue,
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      totalProducts,
      inStockCount,
      lowStockCount,
      outOfStockCount
    },
    settings
  });
});

export default router;
