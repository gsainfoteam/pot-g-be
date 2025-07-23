import { Pot } from "@src/pot/model/pot";

export const AssertIfValidPot = (pot: Pot, potPk: string, message?: string) => {
  if (pot.pk !== potPk || pot.isArchived) {
    throw new Error(message || "Pot ID does not match or pot is archived");
  }
};

export const AssertIfUserInPot = (
  pot: Pot,
  userId: string,
  message?: string,
) => {
  if (!pot.joinedUserPks.includes(userId)) {
    throw new Error(message || "User is not in the pot");
  }
};

export const AssertIfAllUserInPot = (
  pot: Pot,
  userIds: string[],
  message?: string,
) => {
  if (!userIds.every((userId) => pot.joinedUserPks.includes(userId))) {
    throw new Error(message || "Not all users are in the pot");
  }
};

export const AssertIfAccountingRequestedUser = (
  pot: Pot,
  userId: string,
  message?: string,
) => {
  if (pot.accountingRequestUserId !== userId) {
    throw new Error(message || "User is not the recipient");
  }
};

export const AssertIfDepartureTimeSet = (pot: Pot, message?: string) => {
  if (pot.departureTime == null) {
    throw new Error(message || "Departure time is not set");
  }
};

export const AssertIfDepartureTimeNotSet = (pot: Pot, message?: string) => {
  if (pot.departureTime !== null) {
    throw new Error(message || "Departure time is already set");
  }
};

export const AssertIfDeparted = (pot: Pot, message?: string) => {
  if (new Date(pot.departureTime.getTime() + 30 * 60 * 1000) > new Date()) {
    throw new Error(
      message || "Departure time + 30 minutes has not passed yet",
    );
  }
};

export const AssertIfHost = (pot: Pot, userId: string, message?: string) => {
  if (pot.hostUserPk !== userId) {
    throw new Error(message || "User is not the host");
  }
};

export const AssertIfNotHost = (pot: Pot, userId: string, message?: string) => {
  if (pot.hostUserPk === userId) {
    throw new Error(message || "User is the host");
  }
};
