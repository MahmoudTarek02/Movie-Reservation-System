const mongoose = require('mongoose');
const validator = require('validator');

const oauthProviderSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['google'],
      required: true
    },
    providerId: {
      type: String,
      required: true
    },
    profileEmail: String
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    passwordHash: {
      type: String,
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,
    passwordChangedAt: Date,
    oauthProviders: [oauthProviderSchema],
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

userSchema.index({ role: 1 });
userSchema.index({ deletedAt: 1 });
userSchema.index({ 'oauthProviders.provider': 1, 'oauthProviders.providerId': 1 });

module.exports = mongoose.model('User', userSchema);
