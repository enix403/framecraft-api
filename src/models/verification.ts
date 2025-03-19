import { model, Document, Schema, Types } from "mongoose";

export interface IVerification extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  email: string;
  token: string;
  expiresIn: Date;
}

const VerificationSchema = new Schema<IVerification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    email: { type: String, required: true },
    token: { type: String, required: true },
    expiresIn: { type: Date, required: true }
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

VerificationSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true
});

export const Verification = model("Verification", VerificationSchema);
