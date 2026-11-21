import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { addMinutes } from "date-fns";
import { PopoChatMsgRepository } from "@src/database/repository/popo-chat-msg.repository";
import { PopoChatReservationRepository } from "@src/database/repository/popo-chat-reservation.repository";
import { RouteService } from "@src/discovery/route.service";
import { TxType } from "@src/global/types/tx.types";
import { Pot } from "@src/pot/model/pot";

@Injectable()
export class DelayCheckService {
  private readonly targetRouteIds: Set<string>;

  constructor(
    configService: ConfigService,
    private readonly popoChatMsgRepository: PopoChatMsgRepository,
    private readonly reservationRepository: PopoChatReservationRepository,
    private readonly routeService: RouteService,
  ) {
    const configuredRouteIds =
      configService.get<string>("DELAY_CHECK_ROUTE_IDS") ?? "";

    this.targetRouteIds = new Set(
      configuredRouteIds
        .split(",")
        .map((routeId) => routeId.trim())
        .filter(Boolean),
    );
  }

  async reserveIfEligible(pot: Pot, departureTime: Date, tx: TxType) {
    if (!this.targetRouteIds.has(pot.routePk)) {
      return;
    }

    const route = this.routeService.getRouteById(pot.routePk);

    if (!route?.fromStop) {
      throw new InternalServerErrorException(
        "Delay check departure stop was not found",
      );
    }

    const policy = await this.popoChatMsgRepository.findByType(
      "popo-delay-check-request-v1",
      tx,
    );

    if (!policy || policy.offsetMinutes === null) {
      throw new InternalServerErrorException(
        "Delay check message policy is not initialized",
      );
    }

    if (!policy.enabled) {
      return;
    }

    const now = new Date();

    const scheduledAt = addMinutes(departureTime, policy.offsetMinutes);

    const sendAfter = scheduledAt > now ? scheduledAt : now;

    await this.reservationRepository.deleteByPotFkAndType(
      pot.pk,
      "popo-delay-check-request-v1",
      tx,
    );

    return this.reservationRepository.insert(
      {
        potFk: pot.pk,
        popoChatMsgType: "popo-delay-check-request-v1",
        sendAfter,
        createdAt: now,
        updatedAt: now,
        formatArguments: {
          stationName: route.fromStop.nameKor,
          departureTime: departureTime.toISOString(),
        },
      },
      tx,
    );
  }
}
