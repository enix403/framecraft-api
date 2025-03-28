import { Document, Schema, Types, model } from "mongoose";

/* ===================== */

export interface IUser extends Document<Types.ObjectId> {
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  fullName: string;
  isActive: boolean;
  isVerified: boolean;

  /* ====== Optional profile fields ====== */

  bio?: string;
  gender?: "male" | "female";
  dateOfBirth?: Date;
  phoneCountryCode?: string;
  phoneNumber?: string;

  addressCountry?: string;
  addressCity?: string;
  addressArea?: string;
  addressZip?: string;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "user"],
      required: true
    },

    fullName: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    /* ======= */

    bio: { type: String },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    dateOfBirth: { type: String },
    phoneCountryCode: { type: String },
    phoneNumber: { type: String },

    addressCountry: { type: String },
    addressCity: { type: String },
    addressArea: { type: String },
    addressZip: { type: String },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: {
      virtuals: true,
      transform(doc, ret, options) {
        // Remove passwordHash from any JSON response
        delete ret.passwordHash;
        return ret;
      }
    }
  }
);

export const User = model("User", userSchema);
