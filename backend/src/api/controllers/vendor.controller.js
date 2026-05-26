const Vendor = require('../../domains/vendors/vendor.model');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');

exports.createVendor = catchAsync(async (req, res, next) => {
  const vendor = await Vendor.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ status: 'success', data: { vendor } });
});

exports.getAllVendors = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Vendor.find({ isDeleted: false }).populate('category'), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
    
  const vendors = await features.query;
  const total = await Vendor.countDocuments({ isDeleted: false });
  
  res.status(200).json({ status: 'success', results: vendors.length, total, data: { vendors } });
});

exports.getVendor = catchAsync(async (req, res, next) => {
  const vendor = await Vendor.findById(req.params.id)
    .populate('category')
    .populate('activeAssignments');
    
  if (!vendor) return next(new AppError('No vendor found with that ID', 404));
  res.status(200).json({ status: 'success', data: { vendor } });
});

exports.updateVendor = catchAsync(async (req, res, next) => {
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!vendor) return next(new AppError('No vendor found with that ID', 404));
  res.status(200).json({ status: 'success', data: { vendor } });
});

exports.deleteVendor = catchAsync(async (req, res, next) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return next(new AppError('No vendor found with that ID', 404));
  
  // We don't hard delete. We just suspend or inactive it per requirements, or soft delete.
  vendor.status = 'Inactive';
  vendor.isDeleted = true;
  await vendor.save();
  
  res.status(204).json({ status: 'success', data: null });
});
