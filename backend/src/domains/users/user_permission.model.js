const mongoose = require('mongoose');

const userPermissionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  permission_key: { type: String, required: true, uppercase: true, trim: true },
  scope: { type: String, enum: ['SELF', 'TEAM', 'BRANCH', 'ALL'], default: 'SELF' },
  assigned_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// A user should only have one scope per permission key to avoid conflicts
userPermissionSchema.index({ user_id: 1, permission_key: 1 }, { unique: true });

module.exports = mongoose.model('UserPermission', userPermissionSchema);
