const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = [
  'MD_CEO',
  'CEO',
  'COO',
  'BRANCH_HEAD',
  'ADMIN',
  'HR',
  'SR_SALES_MANAGER',
  'SALES_MANAGER',
  'SR_SALES_EXEC',
  'SALES_EXEC',
  'FIELD_EXEC',
  'OPERATION_MANAGER',
  'OPERATION_EXEC',
  'PRODUCTION_MANAGER',
  'PRODUCTION_EXEC',
  'SERVICE_MANAGER',
  'SERVICE_EXEC',
  'DESIGNER',
  'AGENT',
  'VENDOR',
  'IT',
  'ACCOUNTS',
];

const DEPARTMENTS = [
  'Management',
  'Sales',
  'Operations',
  'Production',
  'Human Resources',
  'Design & Creative',
  'Field',
  'SERVICE_OPERATIONS',
  'IT',
  'Accounts',
  'Vendor Management',
];

const userSchema = new mongoose.Schema(
  {
    // ── Core Identity ──────────────────────────────────────
    name: { type: String, required: true, trim: true },
    username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },

    // ── Role & Department ──────────────────────────────────
    role: { type: String, enum: ROLES, default: 'SALES_EXEC' },
    department: { type: String, enum: DEPARTMENTS },

    // ── Organization Hierarchy ─────────────────────────────
    reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hierarchyLevel: { type: Number, default: 5 }, // 0: Admin, 1: HR/CEO, 2: Sr Manager, 3: Manager, 4: Sr Exec, 5: Exec
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, // Reference to TEAM_MAPPING if needed

    // ── Account Status ─────────────────────────────────────
    // ONLY 'ACTIVE' accounts can log in
    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PROBATION'],
      default: 'PENDING_APPROVAL',
    },

    // ── Employment Details ─────────────────────────────────
    dateOfJoining: { type: Date },
    employmentType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'],
      default: 'FULL_TIME',
    },
    experience: { type: String }, // e.g. "3 years 2 months"
    profileImage: { type: String }, // URL / file path

    // ── Identity Documents ─────────────────────────────────
    aadhaarNumber: { type: String, select: false }, // sensitive — excluded by default

    // ── Salary ─────────────────────────────────────────────
    // Salary changes require Admin approval (stored in hrPolicy)
    currentSalary: { type: Number, select: false },

    // ── Probation ──────────────────────────────────────────
    probationEndDate: { type: Date },
    isPermanent: { type: Boolean, default: false },

    // ── Exit Management ────────────────────────────────────
    resignationDate: { type: Date },
    exitDate: { type: Date },
    exitReason: { type: String },
    exitType: {
      type: String,
      enum: ['RESIGNED', 'TERMINATED', 'RETIRED', 'CONTRACT_ENDED'],
    },

    // ── Governance / Audit Fields ──────────────────────────
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ── Notification Preferences ───────────────────────────
    notificationsEnabled: { type: Boolean, default: true },

    // ── Password Reset Flags ────────────────────────────────────
    mustChangePassword: { type: Boolean, default: true }, // true = first login, must set new password

    // ── Password Reset ─────────────────────────────────────────
    passwordChangedAt: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // ── Performance Targets ────────────────────────────────────
    monthlyTarget: { type: Number, default: 0 },
    targetMonth: { type: String }, // e.g. "2026-05"
  },
  { timestamps: true }
);

// ── Indexes (compound only — single-field indexes set via schema definition) ──
userSchema.index({ role: 1, status: 1 });
userSchema.index({ department: 1 });


// ── Auto-generate Employee ID BEFORE validation (so required fields pass) ──
// Mongoose 9: async hooks use the returned Promise — do NOT call next()
userSchema.pre('validate', async function () {
  if (this.isNew && !this.username) {
    const User = mongoose.model('User');
    // Find the highest existing emp-XXXX username
    const lastUser = await User.findOne({ username: /^emp-\d{4}$/i }).sort({ username: -1 });
    let nextId = 1;
    if (lastUser && lastUser.username) {
      const match = lastUser.username.match(/emp-(\d+)/i);
      if (match) {
        nextId = parseInt(match[1], 10) + 1;
      }
    } else {
      const count = await User.countDocuments();
      nextId = count + 1;
    }
    this.username = `emp-${String(nextId).padStart(4, '0')}`;
  }
});

// ── Hash password before saving ──────────────────────────────────────
// Mongoose 9: async hooks use the returned Promise — do NOT call next()
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
});


// ── Instance method: compare password ────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ── Instance method: check if account is allowed to log in ───
userSchema.methods.canLogin = function () {
  return this.status === 'ACTIVE' || this.status === 'PROBATION';
};

// ── Static: roles HR is NOT allowed to assign ────────────────
userSchema.statics.HR_RESTRICTED_ROLES = ['MD_CEO', 'ADMIN'];
userSchema.statics.ROLES = ROLES;
userSchema.statics.DEPARTMENTS = DEPARTMENTS;

const User = mongoose.model('User', userSchema);
module.exports = User;
