import { PotRoomEntity } from "@src/database/entity/pot-room.entity";

export type ChatMessage = {
  userPk: string; // 채팅을 보낸 유저의 ID
  message: string; // 채팅 메시지
  timestamp: Date; // 메시지 전송 시간
};

export type PotStatus =
  | "BEFORE_CONFIRMED" // 출발 확정 전
  | "CONFIRMED" // 출발 확정 후
  | "WAIT_ACCOUNTING" // 정산 대기 중
  | "ACCOUNTING_DONE" // 정산 완료;
  | "ARCHIVED"; // 방이 아카이브된 상태

export class Pot {
  constructor() {
    this.joinedUserPks = [];
    this.accountingRequestedUserPks = [];
    this.accountingConfirmedUserPks = [];
    this.chatHistory = [];
  }

  pk: string;
  name: string;

  hostUserPk: string; // 방장
  joinedUserPks: string[] = []; // 참여자
  loggedUserPks: string[] = []; // 한번이라도 팟에 참여한 적이 있는 유저 (퇴장했더라도 남아있음) /info API 용도
  routePk: string; // 택시 경로
  maxCapacity: number; // 최대 인원

  departureAvailableStartTime: Date; // 출발 가능 시작 시간
  departureAvailableEndTime: Date; // 출발 가능 종료 시간

  departureTime: Date | null = null; // 출발 시간

  createAt: Date;
  updateAt: Date;

  isArchived: boolean; // 방 삭제 여부
  isDeleted: boolean; // 방 완전 삭제 여부

  accountingRequestUserId: string | null; // 송금 받을 유저의 ID
  totalCost: number | null; // 송금 받을 금액 (원)
  costPerUser: number | null; // 1인당 송금 금액 (원)

  bankPk: string | null;
  bankName: string | null; // 은행 이름 (추후 사용자에게 보여주기 위함이므로 이름 저장)
  bankAccount: string | null; // 은행 계좌

  accountingRequestedUserPks: string[] = []; // 송금 보낼 유저의 ID 리스트
  accountingConfirmedUserPks: string[] = []; // 송금 보낸 유저의 ID 리스트

  chatHistory: ChatMessage[] = [];

  public getStatus(userPk: string): PotStatus {
    // 아카이브 된 상태 -> "ARCHIVED"
    if (this.isArchived) {
      return "ARCHIVED";
    }
    // 출발 시간도 안정해진 상태 -> "BEFORE_CONFIRMED"
    if (!this.departureTime) {
      return "BEFORE_CONFIRMED";
    }

    const now = new Date();

    // 출발 시간이 정해졌지만 아직 지나지 않은 상태 -> "CONFIRMED"
    if (this.departureTime > now) {
      return "CONFIRMED";
    }
    // 정산이 완료되지 않은 상태 -> "WAIT_ACCOUNTING"
    if (
      this.accountingRequestUserId == null ||
      this.accountingRequestedUserPks.includes(userPk) // 정산자가 정산 요청을 하지 않았더라도 정산 전으로 표시합니다.
    ) {
      return "WAIT_ACCOUNTING";
    }

    // 내가 정산 요청을 했고, 정산이 완료되지 않은 상태 -> "WAIT_ACCOUNTING"
    if (
      this.accountingRequestUserId &&
      this.accountingRequestUserId === userPk &&
      this.accountingRequestedUserPks.length > 0
    ) {
      return "WAIT_ACCOUNTING";
    }
    // 정산이 완료되었고 아카이브 되지 않은 상태 -> "ACCOUNTING_DONE"
    return "ACCOUNTING_DONE";
  }

  public toPotRoomEntity(): PotRoomEntity {
    return {
      pk: this.pk,
      routeFk: this.routePk,
      isArchived: this.isArchived,
      isDeleted: this.isDeleted,
      isDepartureConfirmed: this.departureTime !== null,
      maxCapacity: this.maxCapacity,
      startsAt: this.departureAvailableStartTime,
      endsAt: this.departureAvailableEndTime,
      createdAt: this.createAt,
      updatedAt: this.updateAt,
      name: this.name,
    };
  }
}
