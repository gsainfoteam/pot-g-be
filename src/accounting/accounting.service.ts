import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from "@nestjs/common";
import { BankDto } from "@src/accounting/dto/bank.dto";
import { ChangeAccountingRequestDto } from "@src/accounting/dto/change-accounting.dto";
import { AccountingDto } from "@src/user/dto/accounting.dto";
import { UserContext } from "@src/auth/user-context.entity";
import { BankEntity } from "@src/database/entity/bank.entity";
import { BankRepository } from "@src/database/repository/bank.repository";
import { UserBankRepository } from "@src/database/repository/user-bank.repository";
import { UserBankEntity } from "@src/database/entity/user-bank.entity";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";
import { BaseResultDto } from "@src/global/dto/base-result.dto";
import { PotService } from "@src/pot/pot.service";
import { PotAccountingRequestEventV1 } from "@src/pot/event/v1/pot-accounting-request-event";
import { RequestAccountingRequestDto } from "@src/accounting/dto/request-accounting.dto";
import { PotEventReducer } from "@src/pot/event/pot-event-reducer";
import { PotEventError } from "@src/global/exceptions/pot-event.error";
import { BroadcastingService } from "@src/broadcasting/broadcasting.service";
import { PotEventRepository } from "@src/database/repository/pot-event.repository";
import { PotAccountingConfirmEventV1 } from "@src/pot/event/v1/pot-accounting-confirm-event";
import { Pot } from "@src/pot/model/pot";
import { addMinutes, getUnixTime } from "date-fns";
import { PopoService } from "@src/popo/popo.service";
import { ConfirmAccountingRequestDto } from "@src/accounting/dto/confirm-accounting.dto";

@Injectable()
export class AccountingService implements OnModuleInit {
  private readonly ACCOUNT_REGEX = new RegExp(/^(\d+)$/);
  private cachedBanks: BankEntity[] = [];

  constructor(
    private readonly dbService: DatabaseService,
    private readonly potService: PotService,
    private readonly broadcastingService: BroadcastingService,
    private readonly popoService: PopoService,
    private readonly bankRepository: BankRepository,
    private readonly userBankRepository: UserBankRepository,
    private readonly potEventRepository: PotEventRepository,
  ) {}

  async onModuleInit() {
    await this.cacheBanks();
  }

  async changeAccounting(
    req: ChangeAccountingRequestDto,
    userCtx: UserContext,
  ): Promise<AccountingDto> {
    // Check if req.bank_pk is valid
    const requestedBank = this.cachedBanks.find((b) => b.pk === req.bank_pk);
    if (!requestedBank) {
      throw new BadRequestException("Invalid bank_pk");
    }

    // Check if req.account is valid
    if (!this.ACCOUNT_REGEX.test(req.account)) {
      throw new BadRequestException("Invalid account format");
    }

    // Find existing user bank
    const userBank: UserBankEntity = await this.userBankRepository.findByUserPk(
      userCtx.userId,
    );

    await this.dbService.db.transaction(async (tx: TxType) => {
      if (userBank) {
        // Update existing user bank
        await this.updateUserBank(userBank, requestedBank, req.account, tx);
      } else {
        // Insert new user bank
        const newUserBank: UserBankEntity = {
          userFk: userCtx.userId,
          bankFk: requestedBank.pk,
          account: req.account,
        };

        await this.userBankRepository.insert(newUserBank, tx);
      }
    });

    return {
      is_set: true,
      bank_short_name: requestedBank.bankShortName,
      account: req.account,
    };
  }

  async getBanks(): Promise<BankDto[]> {
    return this.cachedBanks.map((bankEntity) => {
      return {
        id: bankEntity.pk,
        bank_full_name: bankEntity.bankFullName,
        logo: bankEntity.logo,
      };
    });
  }

  async requestAccounting(
    potPk: string,
    req: RequestAccountingRequestDto,
    userCtx: UserContext,
  ): Promise<BaseResultDto> {
    // 아래 두 validation 은 DTO validation 으로 취급하고 PotAccountingRequestEventV1 클래스에서 validate 하지 않습니다.
    // 1인당 부담 금액과 총 정산 금액에 큰 차이가 발생하는 경우 (5000원 이상) 요청 거부
    if (
      Math.abs(
        req.total_cost - req.cost_per_user * (req.requested_user.length + 1),
      ) >= 5000
    ) {
      return BaseResultDto.CostPerUserMismatch;
    }

    if (req.total_cost < 0 || req.cost_per_user < 0) {
      return BaseResultDto.CostCannotBeNegative;
    }

    const pot = await this.potService.getPot(potPk);
    if (!pot) {
      return BaseResultDto.PotNotExist;
    }

    // 이미 정산 요청이 들어온 상태인지 확인
    if (pot.accountingRequestUserId) {
      return BaseResultDto.AlreadyRequested;
    }

    // 사용자 정산 계좌 설정 여부 확인
    let userBank: UserBankEntity = await this.userBankRepository.findByUserPk(
      userCtx.userId,
    );
    if (!userBank && req.account_info.use_exist_info) {
      return BaseResultDto.AccountInfoNotSet;
    }

    // 계좌 정보가 없거나, 기존 정보를 사용하지 않는 경우, 요청으로 들어온 계좌 정보 유효성 검사
    if (!userBank || !req.account_info.use_exist_info) {
      // Check if req.bank_pk is valid
      const requestedBank: BankEntity = this.cachedBanks.find(
        (b) => b.pk === req.account_info.bank_pk,
      );
      if (!requestedBank) {
        throw new BadRequestException("Invalid bank_pk");
      }

      // Check if req.account_info.account is valid
      if (!this.ACCOUNT_REGEX.test(req.account_info.account)) {
        throw new BadRequestException("Invalid account format");
      }

      userBank = {
        userFk: userCtx.userId,
        bankFk: requestedBank.pk,
        bankEntity: requestedBank,
        account: req.account_info.account,
      };
    } else {
      const bankEntity: BankEntity = this.cachedBanks.find(
        (b) => b.pk === userBank.bankFk,
      );
      if (!bankEntity) {
        throw new InternalServerErrorException(
          "User bank's bank entity not found",
        );
      }
      userBank.bankEntity = bankEntity;
    }

    const now = new Date();

    const potAccountingRequestEvent: PotAccountingRequestEventV1 =
      PotAccountingRequestEventV1.generatePotAccountingRequestEvent(
        potPk,
        now,
        {
          userPk: userCtx.userId,
          potRoomPk: potPk,
          total_cost: req.total_cost,
          cost_per_user: req.cost_per_user,
          senderUserId: req.requested_user,
          bankPk: userBank.bankFk,
          bankName: userBank.bankEntity.bankShortName,
          bankAccount: userBank.account,
        },
      );

    try {
      PotEventReducer.reduce(pot, potAccountingRequestEvent, true);
    } catch (error) {
      if (error instanceof PotEventError) {
        return error.baseResultDto;
      }
      throw error;
    }

    await this.dbService.db.transaction(async (tx: TxType) => {
      if (req.account_info.need_set) {
        await this.userBankRepository.insert(userBank, tx);
      }
      await this.potEventRepository.saveEvent(potAccountingRequestEvent, tx);
    });

    this.broadcastingService.asyncBroadcastPotEvent(
      {
        pot_pk: pot.pk,
        timestamp: getUnixTime(potAccountingRequestEvent.timestamp),
        id: potAccountingRequestEvent.id,
        event_type: potAccountingRequestEvent.eventType,
        data: potAccountingRequestEvent.toDto(),
      },
      pot.joinedUserPks,
    );

    // total cost 가 0원인 경우 바로 정산 확정 처리
    if (req.total_cost === 0) {
      await this.processConfirmAccounting(pot, {
        accounting_results: req.requested_user.map((userPk) => {
          return {
            user_pk: userPk,
            accounting_done: true,
          };
        }),
      });
    } else {
      // 아닌 경우 포포 정산 안내 메세지 즉시 발송
      const popoChatMsg = this.popoService.getPopoChatMsgByType(
        "popo-accounting-request-v1",
      );
      this.popoService.asyncSendPopoChatMsgToPotRoom(popoChatMsg, null, pot, {
        totalNum: pot.accountingRequestedUserPks.length,
        totalCost: req.total_cost,
        costPerUser: req.cost_per_user,
      });
    }

    // 기존에 예약된 포포 정산 안내 메세지가 있다면 삭제
    this.popoService.asyncDeletePopoChatReservation(
      "popo-accounting-reminder-v1",
      pot.pk,
    );

    return BaseResultDto.OK;
  }

  async confirmAccounting(
    potPk: string,
    req: ConfirmAccountingRequestDto,
    userCtx: UserContext,
  ): Promise<BaseResultDto> {
    const pot = await this.potService.getPot(potPk);
    if (!pot) {
      return BaseResultDto.PotNotExist;
    }

    // 정산 요청자인지 확인
    // 정산 요청이 들어온 상태인지 확인
    if (!pot.accountingRequestUserId) {
      return BaseResultDto.NotYetRequested;
    }

    // 정산 요청자인지 확인
    if (pot.accountingRequestUserId !== userCtx.userId) {
      return BaseResultDto.NotAccountingRequester;
    }

    return this.processConfirmAccounting(pot, req);
  }

  private async processConfirmAccounting(
    pot: Pot,
    req: ConfirmAccountingRequestDto,
  ): Promise<BaseResultDto> {
    const now = new Date();

    const potAccountingConfirmEvent: PotAccountingConfirmEventV1 =
      PotAccountingConfirmEventV1.generatePotAccountingConfirmEvent(
        pot.pk,
        now,
        {
          potRoomPk: pot.pk,
          results: req.accounting_results.map((r) => {
            return {
              userPk: r.user_pk,
              accountingDone: r.accounting_done,
            };
          }),
        },
      );

    try {
      PotEventReducer.reduce(pot, potAccountingConfirmEvent, true);
    } catch (error) {
      if (error instanceof PotEventError) {
        return error.baseResultDto;
      }
      throw error;
    }

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.potEventRepository.saveEvent(potAccountingConfirmEvent, tx);
    });

    this.broadcastingService.asyncBroadcastPotEvent(
      {
        pot_pk: pot.pk,
        timestamp: getUnixTime(potAccountingConfirmEvent.timestamp),
        id: potAccountingConfirmEvent.id,
        event_type: potAccountingConfirmEvent.eventType,
        data: potAccountingConfirmEvent.toDto(),
      },
      pot.joinedUserPks,
    );

    // 정산 처리가 모두 완료된 경우 포포 메세지 전송
    if (pot.accountingRequestedUserPks.length === 0) {
      const popoAutoArchiveAccountingFinMsg =
        this.popoService.getPopoChatMsgByType(
          "popo-auto-archive-accounting-fin-v1",
        );
      this.popoService.asyncSendPopoChatMsgToPotRoom(
        popoAutoArchiveAccountingFinMsg,
        null,
        pot,
      );

      // 10분 후 팟 자동 해산 예약
      const popoAutoArchiveMsg = this.popoService.getPopoChatMsgByType(
        "popo-auto-archive-v1",
      );
      this.popoService.asyncReservePopoChatMsg(
        popoAutoArchiveMsg,
        addMinutes(now, 10),
        null,
        pot,
      );
    }

    return BaseResultDto.OK;
  }

  private async updateUserBank(
    userBank: UserBankEntity,
    bank: BankEntity,
    account: string,
    tx: TxType,
  ): Promise<void> {
    userBank.bankFk = bank.pk;
    userBank.account = account;
    await this.userBankRepository.update(userBank, tx);
  }

  private async cacheBanks() {
    this.cachedBanks = await this.bankRepository.findAll();
  }
}
