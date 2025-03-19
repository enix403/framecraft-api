/* import { ClientSession, ObjectId } from "mongoose";

import { User } from "@/models/user";

export const userService = {
  getById: (userId: ObjectId) => User.findById(userId),
  getByEmail: (email: string) => User.findOne({ email }),
  isExistByEmail: (email: string) => User.exists({ email }),

  updatePasswordByUserId: (
    userId: ObjectId,
    password: string,
    session?: ClientSession
  ) => {
    const data = [{ _id: userId }, { password, resetPasswords: [] }];

    let params: any[];

    if (session) {
      params = [...data, { session }];
    } else {
      params = data;
    }

    // @ts-ignore
    return User.updateOne(...params);
  },

  updateVerificationAndEmailByUserId: (
    userId: ObjectId,
    email: string,
    session?: ClientSession
  ) => {
    const data = [
      { _id: userId },
      { email, verified: true, verifications: [] }
    ];

    let params = null;

    if (session) {
      params = [...data, { session }];
    } else {
      params = data;
    }
    // @ts-ignore
    return User.updateOne(...params);
  },

  updateProfileByUserId: (
    userId: ObjectId,
    { firstName, lastName }: { firstName: string; lastName: string },
    session?: ClientSession
  ) => {
    const data = [{ _id: userId }, { firstName, lastName }];

    let params = null;

    if (session) {
      params = [...data, { session }];
    } else {
      params = data;
    }

    return User.updateOne(...params);
  },

  updateEmailByUserId: (
    userId: ObjectId,
    email: string,
    session?: ClientSession
  ) => {
    const data = [{ _id: userId }, { email, verified: false }];

    let params = null;

    if (session) {
      params = [...data, { session }];
    } else {
      params = data;
    }

    return User.updateOne(...params);
  },

  deleteById: (userId: ObjectId, session?: ClientSession) =>
    User.deleteOne({ user: userId }, { session }),

  addResetPasswordToUser: async (
    {
      userId,
      resetPasswordId
    }: {
      userId: ObjectId;
      resetPasswordId: ObjectId;
    },
    session?: ClientSession
  ) => {
    let options = {};

    if (session) {
      options = { session };
    }

    const user = await User.findOne({ _id: userId }, null, options);

    if (user) {
      if (!user.resetPasswords) {
        user.resetPasswords = [];
      }
      user.resetPasswords.push(resetPasswordId);
      await user.save({ session });
    }
  },

  addVerificationToUser: async (
    {
      userId,
      verificationId
    }: {
      userId: ObjectId;
      verificationId: ObjectId;
    },
    session?: ClientSession
  ) => {
    let options = {};

    if (session) {
      options = { session };
    }

    const user = await User.findOne({ _id: userId }, null, options);

    if (user) {
      if (!user.verifications) {
        user.verifications = [];
      }
      user.verifications.push(verificationId);
      await user.save({ session });
    }
  }
};
 */