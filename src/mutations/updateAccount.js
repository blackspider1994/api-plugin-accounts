import SimpleSchema from "simpl-schema";
import ReactionError from "@reactioncommerce/reaction-error";
import CurrencyDefinitions from "@reactioncommerce/api-utils/CurrencyDefinitions.js";
import { Account } from "../simpleSchemas.js";

 const nextKin = new SimpleSchema({
  name: String,
  address: String,
  phone: String,
  email: String,
  gender: String,
  relation: String
})

 const contactInfo = new SimpleSchema({
  email: String,
  phone: String,
  Address1: String,
  Address2: { type: String, optional: true,label:"Address2" },
  Address3: { type: String, optional: true ,label:"Address3"},
  country: String,
  postcode: String
});
const govId = new SimpleSchema({
  key: {
    type: String,
    optional: true
  },
  value: {
    type: String,
    optional: true
  }
})

const poAddress = new SimpleSchema({
  type: String,
  optional: true
})

const inputSchema = new SimpleSchema({
  accountId: {
    type: String,
    optional: true
  },
  bio: {
    type: String,
    optional: true
  },
  currencyCode: {
    type: String,
    optional: true
  },
  firstName: {
    type: String,
    optional: true
  },
  language: {
    type: String,
    optional: true
  },
  lastName: {
    type: String,
    optional: true
  },
  name: {
    type: String,
    optional: true
  },
  note: {
    type: String,
    optional: true
  },
  picture: {
    type: String,
    optional: true
  },
  username: {
    type: String,
    optional: true
  },
  dob: {
    type: String,
    label: "dob",
    optional: true
  },
  phone: {
    label: "phone",
    type: String,
    optional: true
  },
  govId: [govId],
  poAddress: [{
    type: String,
    optional: true
  }],
  nextKin: {
    label: "nextKin",
    type: nextKin,
    optional: true
  },
  contactInfo: {
    label: "contactInfo",
    type: contactInfo,
    optional: true
  }

});

/**
 * @name accounts/updateAccount
 * @memberof Mutations/Accounts
 * @summary Updates account fields
 * @param {Object} context - GraphQL execution context
 * @param {Object} input - Necessary input for mutation. See SimpleSchema.
 * @param {String} [input.accountId] - optional decoded ID of account on which entry should be updated, for admin
 * @param {String} [input.currencyCode] - currency code
 * @param {String} [input.firstName] - First name
 * @param {String} [input.language] - Language
 * @param {String} [input.lastName] - Last name
 * @param {String} [input.name] - Name
 * @returns {Promise<Object>} Updated account document
 */
export default async function updateAccount(context, input) {
  inputSchema.validate(input);
  const { appEvents, collections, accountId: accountIdFromContext, userId } = context;
  const { Accounts, users } = collections;
  const {
    accountId: providedAccountId,
    bio,
    currencyCode,
    firstName,
    language,
    lastName,
    name,
    note,
    picture,
    username, dob, phone, nextKin,contactInfo, govId, poAddress
  } = input;

  const accountId = providedAccountId || accountIdFromContext;
  if (!accountId) throw new ReactionError("access-denied", "Access Denied");

  const account = await Accounts.findOne({ _id: accountId }, { projection: { userId: 1 } });
  if (!account) throw new ReactionError("not-found", "No account found");

  await context.validatePermissions(`reaction:legacy:accounts:${accountId}`, "update", {
    owner: account.userId
  });

  const updates = {};
  const updatedFields = [];

  if (typeof currencyCode === "string" || currencyCode === null) {
    if (currencyCode !== null && !CurrencyDefinitions[currencyCode]) {
      throw new ReactionError("invalid-argument", `No currency has code "${currencyCode}"`);
    }

    updates["profile.currency"] = currencyCode;
    updatedFields.push("currency");
  }

  if (typeof firstName === "string" || firstName === null) {
    updates["profile.firstName"] = firstName;
    updatedFields.push("firstName");
  }

  if (typeof lastName === "string" || lastName === null) {
    updates["profile.lastName"] = lastName;
    updatedFields.push("lastName");
  }

  if (typeof name === "string" || name === null) {
    // For some reason we store name in two places. Should fix eventually.
    updates.name = name;
    updates["profile.name"] = name;
    updatedFields.push("name");
  }

  if (typeof language === "string" || language === null) {
    updates["profile.language"] = language;
    updatedFields.push("language");
  }

  if (typeof bio === "string" || bio === null) {
    updates["profile.bio"] = bio;
    updatedFields.push("bio");
  }

  if (typeof note === "string" || note === null) {
    updates.note = note;
    updatedFields.push("note");
  }

  if (typeof picture === "string" || picture === null) {
    updates["profile.picture"] = picture;
    updatedFields.push("picture");
  }

  if (typeof username === "string" || username === null) {
    // For some reason we store name in two places. Should fix eventually.
    updates.username = username;
    updates["profile.username"] = username;
    updatedFields.push("username");
  }


  if (typeof dob === "string" || dob === null) {
    // For some reason we store name in two places. Should fix eventually.
    updates.dob = dob;
    updates["profile.dob"] = dob;
    updatedFields.push("dob");
  }
  if (typeof phone === "string" || phone === null) {
    // For some reason we store name in two places. Should fix eventually.
    updates.phone = phone;
    updates["phone"] = phone;
    updatedFields.push("phone");
  }
 
  if (typeof nextKin === "object" || nextKin === null) {
    // For some reason we store name in two places. Should fix eventually.
    updates.nextKin = nextKin;
    updates["nextKin"] = nextKin;
    updatedFields.push("nextKin");
  }
  console.log("contactInfo",contactInfo);
  if (typeof contactInfo === "object" || contactInfo === null) {
    // For some reason we store name in two places. Should fix eventually.
    updates.contactInfo = contactInfo;
    updates["contactInfo"] = contactInfo;
    updatedFields.push("contactInfo");
  }
  if (govId) {
    // For some reason we store name in two places. Should fix eventually.
    updates.govId = govId;
    updates["govId"] = govId;
    updatedFields.push("govId");
  }
  if (poAddress) {
    // For some reason we store name in two places. Should fix eventually.
    updates.poAddress = poAddress ?? "null";
    updates["poAddress"] = poAddress ?? "null";
  }
  if (updatedFields.length === 0) {
    throw new ReactionError("invalid-argument", "At least one field to update is required");
  }

  const modifier = {
    $set: {
      ...updates,
      updatedAt: new Date()
    }
  };
  Account.validate(modifier, { modifier: true });

  const { value: updatedAccount } = await Accounts.findOneAndUpdate({
    _id: accountId
  }, modifier, {
    returnOriginal: false
  });
  await users.update({ _id: accountId }, { $set: { firstName, lastName } })
  await appEvents.emit("afterAccountUpdate", {
    account: updatedAccount,
    updatedBy: userId,
    updatedFields
  });

  return updatedAccount;
}
