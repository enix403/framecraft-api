import { model, Document, Schema, Types } from "mongoose";

/* ===================== */

export interface IUser extends Document<Types.ObjectId> {
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  fullName: string;
  isActive: boolean;
  isVerified: boolean;
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
    isVerified: { type: Boolean, default: false }
  },
  {
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

userSchema.virtual("verifications", {
  ref: "Verification",
  localField: "_id",
  foreignField: "userId",
});

export const User = model("User", userSchema);