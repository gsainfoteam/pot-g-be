import { PotRoomEntity } from "@src/discovery/model/pot-room.entity";

export class Pot {
  constructor() {
    this.joinedUserPks = [];
    this.accountingRequestedUserPks = [];
    this.accountingConfirmedUserPks = [];
  }

  pk: string;
  name: string;

  hostUserPk: string; // 방장
  joinedUserPks: string[] = []; // 참여자
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
  recipientAmount: number | null; // 송금 받을 금액 (원)
  accountingRequestedUserPks: string[] = []; // 송금 보낼 유저의 ID 리스트
  accountingConfirmedUserPks: string[] = []; // 송금 보낸 유저의 ID 리스트

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
