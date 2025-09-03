import crypto from "crypto";
export const createHashedPassword = (data) => {
  return crypto.createHash("sha512").update(data).digest("hex");
};
