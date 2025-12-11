const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    settings: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Settings',
      default: null,
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);


userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.addRefreshToken = async function (token) {
  const user = await this.constructor.findById(this._id).select('+refreshTokens');
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.refreshTokens) {
    user.refreshTokens = [];
  }
  if (user.refreshTokens.length >= 5) {
    user.refreshTokens.shift();
  }
  user.refreshTokens.push(token);
  await user.save();
  return user;
};

userSchema.methods.removeRefreshToken = async function (token) {
  const user = await this.constructor.findById(this._id).select('+refreshTokens');
  if (!user) {
    return;
  }

  if (user.refreshTokens && Array.isArray(user.refreshTokens)) {
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    await user.save();
  }
  return user;
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
