export class BaseResultDto {
  result: string;

  static OK: BaseResultDto = {
    result: "OK",
  };

  static PotNotExist: BaseResultDto = {
    // potPk 가 존재하지 않는 팟인 경우
    result: "PotNotExist",
  };

  static AfterDepartureConfirmed: BaseResultDto = {
    // 출발 시간이 확정된 경우
    result: "AfterDepartureConfirmed",
  };

  static PotAlreadyClosed: BaseResultDto = {
    // 이미 해산된 팟인 경우
    result: "PotAlreadyClosed",
  };

  static PotFull: BaseResultDto = {
    // 팟이 이미 가득 찬 경우
    result: "PotFull",
  };

  static UserNotInPot: BaseResultDto = {
    // 팟에 참여하지 않은 사용자인 경우
    result: "UserNotInPot",
  };

  static NotYetPaymentConfirmed: BaseResultDto = {
    // 본인이 정산 요청 대상자인데 본인의 정산이 확인되지 않은 경우
    result: "NotYetPaymentConfirmed",
  };

  static NotYetPaymentCompleted: BaseResultDto = {
    // 본인이 정산자인데 정산이 완료되지 않은 다른 사람이 있는 경우
    result: "NotYetPaymentCompleted",
  };

  static NotAHost: BaseResultDto = {
    // 해당 채팅방의 방장이 아닌 경우
    result: "NotAHost",
  };

  static NotAParticipant: BaseResultDto = {
    // 해당 채팅방에 없는 사용자인 경우
    result: "NotAParticipant",
  };

  static CannotKickSelf: BaseResultDto = {
    // 본인이 본인을 강퇴하려고 하는 경우
    result: "CannotKickSelf",
  };

  static BeforeNow: BaseResultDto = {
    // 현재 시간보다 이른 시간으로 시간을 확정하는 경우
    result: "BeforeNow",
  };

  static NotInAvailableTimeRange: BaseResultDto = {
    // 출발 가능 시작 시간과 출발 가능 종료 시간 사이가 아닌 시간으로 시간을 확정하는 경우
    result: "NotInAvailableTimeRange",
  };

  static AccountInfoNotSet: BaseResultDto = {
    // 사용자 정산 계좌가 설정되지 않은 경우
    result: "AccountInfoNotSet",
  };

  static CostPerUserMismatch: BaseResultDto = {
    // 1인당 부담 금액과 총 정산 금액에 큰 차이가 발생하는 경우
    result: "CostPerUserMismatch",
  };

  static CostCannotBeNegative: BaseResultDto = {
    // 금액이 음수인 경우
    result: "CostCannotBeNegative",
  };
}
