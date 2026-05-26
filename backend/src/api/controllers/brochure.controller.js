const Brochure = require('../../domains/sales/brochures/brochure.model');
const History = require('../../domains/sales/brochures/brochure_history.model');
const Category = require('../../domains/sales/brochures/category.model');
const Prospect = require('../../domains/sales/prospects/prospect.model');

// GET /api/brochures — List active brochures for Executives
exports.list = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    
    // Only Managers can see INACTIVE brochures. Executives only see ACTIVE.
    if (!['ADMIN', 'SALES_MANAGER', 'SR_SALES_MANAGER'].includes(req.user.role)) {
      filter.status = 'ACTIVE';
    }
    
    // Allow explicitly querying by status
    if (req.query.status) filter.status = req.query.status;

    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const brochures = await Brochure.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: brochures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const fs = require('fs');
const path = require('path');

// Helper to save base64 to file
const saveBase64ToFile = (req, base64String, folder, filename) => {
  if (!base64String || !base64String.startsWith('data:')) return base64String;
  
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return base64String;
  
  const extension = matches[1].split('/')[1] || 'bin';
  const fileData = matches[2];
  const buffer = Buffer.from(fileData, 'base64');
  
  const uploadDir = path.join(__dirname, '../../../public/uploads', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const finalFilename = `${filename}.${extension}`;
  const filePath = path.join(uploadDir, finalFilename);
  fs.writeFileSync(filePath, buffer);
  
  const hostUrl = `${req.protocol}://${req.get('host')}`;
  return `${hostUrl}/uploads/${folder}/${finalFilename}`;
};

// POST /api/brochures — Create new (Admin/Manager)
exports.create = async (req, res) => {
  try {
    if (!['ADMIN', 'SALES_MANAGER', 'SR_SALES_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const count = await Brochure.countDocuments();
    const brochureId = `BRC-${String(count + 1).padStart(3, '0')}`;
    
    let { fileUrl, thumbnailUrl, ...restBody } = req.body;
    
    // Convert Base64 strings to actual files if provided
    const timestamp = Date.now();
    if (fileUrl && fileUrl.startsWith('data:')) {
      fileUrl = saveBase64ToFile(req, fileUrl, 'brochures', `brochure_${brochureId}_${timestamp}`);
    }
    if (thumbnailUrl && thumbnailUrl.startsWith('data:')) {
      thumbnailUrl = saveBase64ToFile(req, thumbnailUrl, 'thumbnails', `thumb_${brochureId}_${timestamp}`);
    }

    const brochure = new Brochure({
      ...restBody,
      fileUrl,
      thumbnailUrl,
      brochureId,
      uploadedBy: req.user._id
    });
    
    await brochure.save();
    res.status(201).json({ success: true, data: brochure });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PATCH /api/brochures/:id — Update (Admin/Manager)
exports.update = async (req, res) => {
  try {
    if (!['ADMIN', 'SALES_MANAGER', 'SR_SALES_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    let { fileUrl, thumbnailUrl, ...restBody } = req.body;
    const existing = await Brochure.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Brochure not found' });
    
    const timestamp = Date.now();
    if (fileUrl && fileUrl.startsWith('data:')) {
      fileUrl = saveBase64ToFile(req, fileUrl, 'brochures', `brochure_${existing.brochureId}_${timestamp}`);
    }
    if (thumbnailUrl && thumbnailUrl.startsWith('data:')) {
      thumbnailUrl = saveBase64ToFile(req, thumbnailUrl, 'thumbnails', `thumb_${existing.brochureId}_${timestamp}`);
    }

    const updateData = { ...restBody };
    if (fileUrl) updateData.fileUrl = fileUrl;
    if (thumbnailUrl) updateData.thumbnailUrl = thumbnailUrl;

    const brochure = await Brochure.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, data: brochure });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/brochures/:id — Delete (Admin/Manager)
exports.remove = async (req, res) => {
  try {
    if (!['ADMIN', 'SALES_MANAGER', 'SR_SALES_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const brochure = await Brochure.findByIdAndDelete(req.params.id);
    if (!brochure) return res.status(404).json({ success: false, message: 'Brochure not found' });
    
    // Optional: Delete physical files associated with it
    // if (brochure.fileUrl) ...
    
    res.json({ success: true, message: 'Brochure deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/brochures/send — Log history and simulate WhatsApp send
exports.send = async (req, res) => {
  try {
    const { brochureId, clientPhone, clientName } = req.body;
    
    // Anti-spam: Check daily limit (e.g., 50 per day per exec)
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const dailyCount = await History.countDocuments({
      sentBy: req.user._id,
      sentAt: { $gte: startOfDay }
    });
    
    if (dailyCount >= 50) {
      return res.status(429).json({ success: false, message: 'Daily sharing limit reached' });
    }

    const brochure = await Brochure.findById(brochureId);
    if (!brochure) return res.status(404).json({ success: false, message: 'Brochure not found' });

    // Log History
    const history = new History({
      brochure: brochure._id,
      sentBy: req.user._id,
      clientPhone,
      clientName,
      status: 'Sent'
    });
    await history.save();

    // Increment send count
    brochure.sendCount += 1;
    await brochure.save();

    // Here we would trigger the WhatsApp API
    // For now, we simulate success
    // Update Prospect if exists
    const prospectFilter = req.body.prospectId ? { _id: req.body.prospectId } : { phone: clientPhone };
    await Prospect.findOneAndUpdate(prospectFilter, {
      $push: { 
        whatsappActions: { action: 'Brochure', sentAt: new Date() },
        interactions: { 
          type: 'WhatsApp', 
          notes: `Catalog Sent: ${brochure.title}`, 
          date: new Date() 
        }
      },
      $set: { lastInteraction: new Date(), lastInteractionNote: `Shared catalog: ${brochure.title}` }
    });

    res.json({ 
      success: true, 
      message: `Brochure "${brochure.title}" sent to ${clientPhone} via WhatsApp`,
      data: history 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/brochures/history — View history
exports.history = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'SR_SALES_EXEC') filter.sentBy = req.user._id;
    
    const history = await History.find(filter)
      .populate('brochure', 'title brochureId')
      .populate('sentBy', 'name')
      .sort({ sentAt: -1 });
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/brochures/categories
exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.find({ active: true });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
