import express from 'express';
import { readData, writeData } from '../db.js';

const router = express.Router();
const PRODUCTS_FILE = 'products.json';

// GET all products with optional filters
router.get('/', (req, res) => {
  const { category, gender, search, stock_status, featured } = req.query;
  let products = readData(PRODUCTS_FILE);

  if (category && category !== 'All') {
    products = products.filter(p => p.category?.toLowerCase() === category.toLowerCase());
  }

  if (gender && gender !== 'All') {
    products = products.filter(p => p.gender?.toLowerCase() === gender.toLowerCase() || p.gender?.toLowerCase() === 'unisex');
  }

  if (featured === 'true') {
    products = products.filter(p => p.featured === true);
  }

  if (stock_status) {
    products = products.filter(p => p.stock_status === stock_status);
  }

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.subtitle?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      (p.notes && Object.values(p.notes).some(n => n.toLowerCase().includes(q)))
    );
  }

  res.json({ success: true, count: products.length, products });
});

// GET single product by ID
router.get('/:id', (req, res) => {
  const products = readData(PRODUCTS_FILE);
  const product = products.find(p => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  res.json({ success: true, product });
});

// POST create new product (Admin)
router.post('/', (req, res) => {
  const products = readData(PRODUCTS_FILE);
  const body = req.body;

  const hasPrice = body.price || (body.sizes && Array.isArray(body.sizes) && body.sizes.length > 0 && body.sizes[0].price);
  if (!body.name || !hasPrice) {
    return res.status(400).json({ success: false, error: 'Product name and price/sizes are required' });
  }

  const newProduct = {
    id: `as-${Date.now().toString().slice(-4)}`,
    name: body.name,
    subtitle: body.subtitle || 'Eau de Parfum',
    tagline: body.tagline || '',
    category: body.category || 'Oud',
    gender: body.gender || 'Unisex',
    badge: body.badge || '',
    price: Number(body.price || (body.sizes && body.sizes[0] ? body.sizes[0].price : 0)),
    compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
    stock_status: body.stock_status || (Number(body.stock_quantity || 0) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'),
    stock_quantity: Number(body.stock_quantity !== undefined ? body.stock_quantity : 10),
    description: body.description || '',
    sizes: Array.isArray(body.sizes) && body.sizes.length > 0 ? body.sizes.map(s => ({
      volume: s.volume || '50ml',
      price: Number(s.price || body.price || 0),
      in_stock: s.in_stock !== false
    })) : [
      { volume: '50ml', price: Number(body.price || 0), in_stock: true }
    ],
    longevity: body.longevity || '10+ Hours',
    sillage: body.sillage || 'Enveloping',
    image: body.image || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
    featured: body.featured === true || body.featured === 'true',
    rating: 5.0,
    reviewsCount: 1,
    createdAt: new Date().toISOString()
  };

  products.unshift(newProduct);
  writeData(PRODUCTS_FILE, products);

  res.status(201).json({ success: true, product: newProduct });
});

// PUT update product (Admin)
router.put('/:id', (req, res) => {
  const products = readData(PRODUCTS_FILE);
  const index = products.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const existing = products[index];
  const body = req.body;

  const stock_quantity = body.stock_quantity !== undefined ? Number(body.stock_quantity) : existing.stock_quantity;
  let stock_status = body.stock_status || existing.stock_status;
  if (stock_quantity <= 0) {
    stock_status = 'OUT_OF_STOCK';
  }

  const sizes = Array.isArray(body.sizes) && body.sizes.length > 0 
    ? body.sizes.map(s => ({
        volume: s.volume || '50ml',
        price: Number(s.price || 0),
        in_stock: s.in_stock !== false
      }))
    : existing.sizes;

  const basePrice = sizes && sizes[0] ? sizes[0].price : (body.price !== undefined ? Number(body.price) : existing.price);

  const updatedProduct = {
    ...existing,
    ...body,
    sizes,
    price: basePrice,
    compareAtPrice: body.compareAtPrice !== undefined ? (body.compareAtPrice ? Number(body.compareAtPrice) : null) : existing.compareAtPrice,
    stock_quantity,
    stock_status,
    updatedAt: new Date().toISOString()
  };

  products[index] = updatedProduct;
  writeData(PRODUCTS_FILE, products);

  res.json({ success: true, product: updatedProduct });
});

// PATCH quick update stock status and availability count (Admin)
router.patch('/:id/stock', (req, res) => {
  const products = readData(PRODUCTS_FILE);
  const index = products.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const { stock_status, stock_quantity } = req.body;
  const product = products[index];

  if (stock_quantity !== undefined) {
    product.stock_quantity = Number(stock_quantity);
    if (product.stock_quantity <= 0) {
      product.stock_status = 'OUT_OF_STOCK';
    } else if (stock_status) {
      product.stock_status = stock_status;
    } else if (product.stock_status === 'OUT_OF_STOCK') {
      product.stock_status = 'IN_STOCK';
    }
  }

  if (stock_status && stock_quantity === undefined) {
    product.stock_status = stock_status;
    if (stock_status === 'OUT_OF_STOCK') {
      // Keep stock_quantity or set to 0 if preferred
    } else if (product.stock_quantity === 0) {
      product.stock_quantity = 5; // Default replenishment if marked in stock
    }
  }

  product.updatedAt = new Date().toISOString();
  products[index] = product;
  writeData(PRODUCTS_FILE, products);

  res.json({ success: true, product });
});

// DELETE product (Admin)
router.delete('/:id', (req, res) => {
  let products = readData(PRODUCTS_FILE);
  const exists = products.some(p => p.id === req.params.id);

  if (!exists) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  products = products.filter(p => p.id !== req.params.id);
  writeData(PRODUCTS_FILE, products);

  res.json({ success: true, message: 'Product deleted successfully' });
});

export default router;
