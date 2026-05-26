const VendorAssignment = require('../../domains/vendors/vendorAssignment.model');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');

exports.createAssignment = catchAsync(async (req, res, next) => {
  // Add logic to check for double bookings/availability conflicts here in the future
  const assignment = await VendorAssignment.create({ ...req.body, assignedBy: req.user._id });
  res.status(201).json({ status: 'success', data: { assignment } });
});

exports.getAllAssignments = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(VendorAssignment.find({ isDeleted: false }).populate('vendor').populate('order'), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
    
  const assignments = await features.query;
  const total = await VendorAssignment.countDocuments({ isDeleted: false });
  
  res.status(200).json({ status: 'success', results: assignments.length, total, data: { assignments } });
});

exports.updateAssignment = catchAsync(async (req, res, next) => {
  const assignment = await VendorAssignment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!assignment) return next(new AppError('No assignment found with that ID', 404));
  res.status(200).json({ status: 'success', data: { assignment } });
});

exports.deleteAssignment = catchAsync(async (req, res, next) => {
  const assignment = await VendorAssignment.findById(req.params.id);
  if (!assignment) return next(new AppError('No assignment found with that ID', 404));
  
  assignment.isDeleted = true;
  await assignment.save();
  res.status(204).json({ status: 'success', data: null });
});
