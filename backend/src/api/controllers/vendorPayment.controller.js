const VendorPayment = require('../../domains/vendors/vendorPayment.model');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');

exports.createPayment = catchAsync(async (req, res, next) => {
  const payment = await VendorPayment.create({ ...req.body, recordedBy: req.user._id });
  res.status(201).json({ status: 'success', data: { payment } });
});

exports.getAllPayments = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(VendorPayment.find({ isDeleted: false }).populate('vendor').populate('assignment'), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
    
  const payments = await features.query;
  const total = await VendorPayment.countDocuments({ isDeleted: false });
  
  res.status(200).json({ status: 'success', results: payments.length, total, data: { payments } });
});

exports.updatePayment = catchAsync(async (req, res, next) => {
  const payment = await VendorPayment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!payment) return next(new AppError('No payment found with that ID', 404));
  res.status(200).json({ status: 'success', data: { payment } });
});

exports.deletePayment = catchAsync(async (req, res, next) => {
  const payment = await VendorPayment.findById(req.params.id);
  if (!payment) return next(new AppError('No payment found with that ID', 404));
  
  payment.isDeleted = true;
  await payment.save();
  res.status(204).json({ status: 'success', data: null });
});
