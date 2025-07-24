export class Pot {
  constructor() {}

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

  pk: string;
  name: string;

  hostUserPk: string; // 방장
  joinedUserPks: string[]; // 참여자
  route: TaxiRoute; // 택시 경로
  maxCapacity: number; // 최대 인원

  departureAvailableStartTime: Date; // 출발 가능 시작 시간
  departureAvailableEndTime: Date; // 출발 가능 종료 시간

  departureTime: Date | null; // 출발 시간

  createAt: Date;
  updateAt: Date;

  isArchived: boolean; // 방 삭제 여부

  accountingRequestUserId: string | null; // 송금 받을 유저의 ID
  recipientAmount: number | null; // 송금 받을 금액 (원)
  accountingRequestedUserPks: string[]; // 송금 보낼 유저의 ID 리스트
  accountingConfirmedUserPks: string[]; // 송금 보낸 유저의 ID 리스트
}

export const TaxiRoute = {
  GIST_TO_GWANGJU_SONGJEONG: "GIST_TO_GWANGJU_SONGJEONG",
  GWANGJU_SONGJEONG_TO_GIST: "GWANGJU_SONGJEONG_TO_GIST",
  GIST_TO_U_SQUARE: "GIST_TO_U_SQUARE",
  U_SQUARE_TO_GIST: "U_SQUARE_TO_GIST",
} as const;

export type TaxiRoute = (typeof TaxiRoute)[keyof typeof TaxiRoute];
