const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false }, // 🟢 'select: false' hides password by default in queries
    avatar: { type: String },
    role: { 
      type: String, 
      enum: ['Student', 'Faculty', 'Admin'], 
      default: 'Student' 
    },
    status: {
      type: String,
      enum: ['Active', 'Blocked'],
      default: 'Active'
    },
    category: {
      type: String,
      default: ''
    },
  },
  { timestamps: true }
);

// 🟢 Hash password before saving if it was modified or newly created
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
 
 

// 🟢 Helper method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual 'id' property for frontend compatibility
userSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Hide password when returning JSON to frontend
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  }
});

userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);