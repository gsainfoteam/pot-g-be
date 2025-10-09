import { randomUUID } from "node:crypto";

export const generateRoomId = (prefix: string): string => {
  const unixTime = Math.floor(Date.now() / 1000);
  const uuid = randomUUID();
  const last4Chars = uuid.slice(-4);
  const randomNumber = Math.floor(Math.random() * 10000);
  return `${prefix}_${unixTime}_${last4Chars}_${randomNumber}`;
};
