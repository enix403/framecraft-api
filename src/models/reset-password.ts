import { model, Document, Schema, Types } from "mongoose";

export interface IResetPassword extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  email: string;
  token: string;
  expiresIn: Date;
  used: boolean;
  usedAt: Date;
}

const ResetPasswordSchema = new Schema<IResetPassword>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    email: { type: String, required: true },
    token: { type: String, required: true },
    expiresIn: { type: Date, required: true },
    used: { type: Boolean, required: true, default: false },
    usedAt: { type: Date }
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

ResetPasswordSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true
});

export const ResetPassword = model("ResetPassword", ResetPasswordSchema);
