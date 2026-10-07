const Product = require('../models/Product');
const { escapeRegex } = require('../utils/regex');

/**
 * @desc    Get all low stock products (stockQuantity <= lowStockThreshold)
 * @route   GET /api/products/low-stock
 * @access  Private
 */
const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      userId: req.user._id,
      isActive: true,
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] }
    }).sort({ stockQuantity: 1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all products (with search and pagination)
 * @route   GET /api/products
 * @access  Private
 */
const getProducts = async (req, res, next) => {
  try {
    const { search, limit = 50, page = 1 } = req.query;

    const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 50, 100));
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const query = {
      userId: req.user._id,
      isActive: true
    };

    if (search && search.trim() !== '') {
      const escaped = escapeRegex(search.trim());
      const searchRegex = new RegExp(escaped, 'i');
      query.$or = [
        { name: searchRegex },
        { sku: searchRegex }
      ];
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Private
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: {}
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, sku, price, costPrice = 0, stockQuantity = 0, lowStockThreshold = 5 } = req.body;

    // Check for duplicate SKU for this user
    const existingProduct = await Product.findOne({
      userId: req.user._id,
      sku: sku.trim()
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: `Product with SKU '${sku}' already exists in your inventory`,
        error: {}
      });
    }

    const product = await Product.create({
      userId: req.user._id,
      name,
      sku: sku.trim(),
      price,
      costPrice,
      stockQuantity,
      lowStockThreshold
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Product with this SKU already exists',
        error: {}
      });
    }
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private
 */
const updateProduct = async (req, res, next) => {
  try {
    const { name, sku, price, costPrice, stockQuantity, lowStockThreshold } = req.body;

    const product = await Product.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: {}
      });
    }

    // Check duplicate SKU if SKU is being updated
    if (sku && sku.trim() !== product.sku) {
      const duplicate = await Product.findOne({
        userId: req.user._id,
        sku: sku.trim(),
        _id: { $ne: product._id }
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Product with SKU '${sku}' already exists in your inventory`,
          error: {}
        });
      }
      product.sku = sku.trim();
    }

    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    if (costPrice !== undefined) product.costPrice = costPrice;
    if (stockQuantity !== undefined) product.stockQuantity = stockQuantity;
    if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Product with this SKU already exists',
        error: {}
      });
    }
    next(error);
  }
};

/**
 * @desc    Soft delete product
 * @route   DELETE /api/products/:id
 * @access  Private
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: {}
      });
    }

    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLowStockProducts,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
