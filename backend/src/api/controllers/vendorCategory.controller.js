const VendorCategory = require('../../domains/vendors/vendorCategory.model');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

exports.createCategory = catchAsync(async (req, res, next) => {
  const category = await VendorCategory.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ status: 'success', data: { category } });
});

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await VendorCategory.find({ isDeleted: false });
  res.status(200).json({ status: 'success', results: categories.length, data: { categories } });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const category = await VendorCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) return next(new AppError('No category found with that ID', 404));
  res.status(200).json({ status: 'success', data: { category } });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await VendorCategory.findById(req.params.id);
  if (!category) return next(new AppError('No category found with that ID', 404));
  if (category.isSystemDefault) return next(new AppError('System default categories cannot be deleted', 400));
  
  category.isDeleted = true;
  await category.save();
  res.status(204).json({ status: 'success', data: null });
});
