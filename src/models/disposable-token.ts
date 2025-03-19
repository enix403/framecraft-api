import { Document, Schema, Types, model } from "mongoose";

export enum DisposableTokenKind {
  Verify = "Verify",
  ResetPassword = "ResetPassword"
}

export interface IDisposableToken extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  email: string;
  kind: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  usedAt: Date;
}

const DisposableTokenSchema = new Schema<IDisposableToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    email: { type: String, required: true },
    kind: { type: String, required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, required: true, default: false },
    usedAt: { type: Date }
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

DisposableTokenSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true
});

export const DisposableToken = model("DisposableToken", DisposableTokenSchema);
