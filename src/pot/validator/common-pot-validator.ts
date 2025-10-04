import { Pot } from "@src/pot/model/pot";
import { PotEventError } from "@src/global/exceptions/pot-event.error";
import { BaseResultDto } from "@src/global/dto/base-result.dto";

const POT_MAX_CAPACITY = 4;

export const AssertIfValidPot = (pot: Pot, potPk: string) => {
  if (pot.pk !== potPk || pot.isArchived) {
    throw new PotEventError(BaseResultDto.PotAlreadyClosed);
  }
};

export const AssertIfUserInPot = (pot: Pot, userId: string) => {
  if (!pot.joinedUserPks.includes(userId)) {
    throw new PotEventError(BaseResultDto.UserNotInPot);
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

export const AssertIfUserAccountingRequestedAndNotConfirmed = (
  pot: Pot,
  userId: string,
) => {
  if (pot.accountingRequestedUserPks.includes(userId)) {
    throw new PotEventError(BaseResultDto.NotYetPaymentConfirmed);
  }
};

export const AssertIfUserAccountingRequestingAndNotCompleted = (
  pot: Pot,
  userId: string,
) => {
  if (
    pot.accountingRequestUserId === userId &&
    pot.accountingRequestedUserPks.includes(userId)
  ) {
    throw new PotEventError(BaseResultDto.NotYetPaymentCompleted);
  }
};

export const AssertIfDepartureTimeSet = (pot: Pot, message?: string) => {
  if (pot.departureTime == null) {
    throw new Error(message || "Departure time is not set");
  }
};

export const AssertIfDepartureTimeNotSet = (pot: Pot) => {
  if (pot.departureTime !== null) {
    throw new PotEventError(BaseResultDto.AfterDepartureConfirmed);
  }
};

export const AssertIfDeparted = (pot: Pot, message?: string) => {
  if (new Date(pot.departureTime.getTime() + 10 * 60 * 1000) > new Date()) {
    throw new Error(
      message || "Departure time + 10 minutes has not passed yet",
    );
  }
};

export const AssertIfHost = (pot: Pot, userId: string) => {
  if (pot.hostUserPk !== userId) {
    throw new PotEventError(BaseResultDto.NotAHost);
  }
};

export const AssertIfNotHost = (pot: Pot, userId: string) => {
  if (pot.hostUserPk === userId) {
    throw new PotEventError(BaseResultDto.CannotKickSelf);
  }
};

export const AssertIfValidCapacity = (
  maxCapacity: number,
  message?: string,
) => {
  // 최대 인원 수는 1명 이상 4명 이하여야 한다.
  if (maxCapacity < 2 || maxCapacity > POT_MAX_CAPACITY) {
    throw new Error(message || "Max capacity must be between 1 and 5");
  }
};

export const AssertIfPotFull = (pot: Pot) => {
  if (pot.joinedUserPks.length >= pot.maxCapacity) {
    throw new PotEventError(BaseResultDto.PotFull);
  }
};

export const AssertIfValidDepartureAvailableTime = (
  departureAvailableStartTime: Date,
  departureAvailableEndTime: Date,
  message?: string,
) => {
  // TODO: 귀찮아서 깨끗하게 안만듦
  const now = new Date();
  // 출발 가능 시간의 범위는 현재 시간 이후여야 한다.
  if (departureAvailableStartTime < now || departureAvailableEndTime < now) {
    throw new Error(
      message || "Departure start time or end time must be in the future",
    );
  }

  // 출발 가능 시작 시간은 출발 가능 종료 시간 이전이어야 한다.
  if (departureAvailableStartTime > departureAvailableEndTime) {
    throw new Error(message || "Departure start time must be before end time");
  }

  // 출발 가능 시작 시간과 출발 종료시간은 24시간 이상 차이날 수 없다
  if (
    departureAvailableEndTime.getTime() -
      departureAvailableStartTime.getTime() >
    24 * 60 * 60 * 1000
  ) {
    throw new Error(
      message || "Departure start time and end time must be within 24 hours",
    );
  }

  // 출발 가능 종료 시간은 현재 시간 이후 30일 이내여야 한다.
  if (
    departureAvailableEndTime >
    new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  ) {
    throw new Error(message || "Departure end time must be within one month");
  }
};

export const AssertIfDepartureTimeBeforeNow = (departureTime: Date) => {
  if (departureTime < new Date()) {
    throw new PotEventError(BaseResultDto.BeforeNow);
  }
};

export const AssertIfValidDepartureTime = (pot: Pot, departureTime: Date) => {
  if (
    departureTime < pot.departureAvailableStartTime ||
    departureTime > pot.departureAvailableEndTime
  ) {
    throw new PotEventError(BaseResultDto.NotInAvailableTimeRange);
  }
};
