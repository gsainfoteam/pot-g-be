import { generateRoomId } from "@src/utils/id-generate";

export class Room {
  constructor() {}

  static generateRoomId = (): string => {
    return generateRoomId("ROOM");
  };

  static generateRoomName = (
    route: TaxiRoute,
    randomNumber: string,
  ): string => {
    const koreanRoute = {
      GIST_TO_GWANGJU_SONGJEONG: "지송",
      GWANGJU_SONGJEONG_TO_GIST: "송지",
      GIST_TO_U_SQUARE: "지유",
      U_SQUARE_TO_GIST: "유지",
    };

    return `${koreanRoute[route]}${randomNumber}`;
  };

  roomId: string;
  name: string;

  hostUserId: string; // 방장
  joinedUserIds: string[]; // 참여자
  route: TaxiRoute; // 택시 경로
  maxCapacity: number; // 최대 인원

  departureStartTime: Date; // 출발 가능 시작 시간
  departureEndTime: Date; // 출발 가능 종료 시간

  createAt: Date;
  updateAt: Date;
}

export const TaxiRoute = {
  GIST_TO_GWANGJU_SONGJEONG: "GIST_TO_GWANGJU_SONGJEONG",
  GWANGJU_SONGJEONG_TO_GIST: "GWANGJU_SONGJEONG_TO_GIST",
  GIST_TO_U_SQUARE: "GIST_TO_U_SQUARE",
  U_SQUARE_TO_GIST: "U_SQUARE_TO_GIST",
} as const;

export type TaxiRoute = (typeof TaxiRoute)[keyof typeof TaxiRoute];
