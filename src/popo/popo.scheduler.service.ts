import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { Subscription } from "rxjs";
import { PopoService } from "@src/popo/popo.service";
import { PopoChatReservationRepository } from "@src/database/repository/popo-chat-reservation.repository";
import { PopoChatReservationEntity } from "@src/database/entity/popo-chat-reservation.entity";
import { PopoChatStringType } from "../../drizzle/schema/popo-chat-msg";
import { SlackService } from "nestjs-slack";

const LOOKAHEAD_MS = 5 * 60_000;

type ReservationTimer = {
  handle: ReturnType<typeof setTimeout>;
  reservation: PopoChatReservationEntity;
};

@Injectable()
export class PopoSchedulerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(PopoSchedulerService.name);
  private readonly timers = new Map<string, ReservationTimer>();
  private readonly processing = new Map<string, Promise<void>>();
  private readonly subscriptions = new Subscription();
  private refreshPromise?: Promise<void>;
  private deliveryPromise?: Promise<void>;
  private stopping = false;

  constructor(
    private readonly popoService: PopoService,
    private readonly slackService: SlackService,
    private readonly reservationRepository: PopoChatReservationRepository,
  ) {}

  async onApplicationBootstrap() {
    // 예약 생성과 취소 이벤트를 구독해 타이머에 즉시 반영합니다.
    this.subscriptions.add(
      this.popoService.reservationCreated$.subscribe((reservation) => {
        this.scheduleReservation(reservation);
      }),
    );
    this.subscriptions.add(
      this.popoService.reservationsCancelled$.subscribe(({ potPk, type }) => {
        this.cancelReservations(potPk, type);
      }),
    );
    // 서버 시작 시 DB의 예약을 조회해 지난 예약을 처리하고 예정된 타이머를 복구합니다.
    await this.handleCron();
  }

  @Cron("0 */5 * * * *", { waitForCompletion: true })
  async handleCron() {
    if (this.stopping) return;
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.refreshReservations();
    try {
      await this.refreshPromise;
    } catch (error) {
      this.logger.error("Failed to refresh Popo reservation timers", error);
      await this.slackService
        .sendText("Popo reservation timer recovery failed: " + String(error))
        .catch((notificationError) =>
          this.logger.error(
            "Failed to report scheduler error",
            notificationError,
          ),
        );
    } finally {
      this.refreshPromise = undefined;
    }
  }

  @Cron("*/10 * * * * *", { waitForCompletion: true })
  async handleDeliveryCron() {
    if (this.stopping || this.deliveryPromise) return;
    this.deliveryPromise = this.popoService.processPendingDeliveries();
    try {
      await this.deliveryPromise;
    } catch (error) {
      this.logger.error("Failed to process pending Popo deliveries", error);
    } finally {
      this.deliveryPromise = undefined;
    }
  }

  private async refreshReservations() {
    const previousTimers = new Map(this.timers);
    const reservations =
      await this.reservationRepository.findAllScheduledBefore(
        new Date(Date.now() + LOOKAHEAD_MS),
      );
    if (this.stopping) return;
    const remainingIds = new Set(
      reservations.map((reservation) => reservation.pk),
    );
    for (const [pk, timer] of previousTimers) {
      // DB에서 사라진 예약의 타이머를 제거하되, 조회 중 교체된 타이머는 유지합니다.
      if (!remainingIds.has(pk) && this.timers.get(pk) === timer)
        this.clearTimer(pk);
    }
    const due: string[] = [];
    for (const reservation of reservations) {
      if (reservation.sendAfter.getTime() <= Date.now()) {
        this.clearTimer(reservation.pk);
        due.push(reservation.pk);
      } else {
        this.scheduleReservation(reservation);
      }
    }
    for (const pk of due) {
      if (this.stopping) break;
      await this.runReservation(pk);
    }
    if (!this.stopping) await this.popoService.processPendingDeliveries();
  }

  private scheduleReservation(reservation: PopoChatReservationEntity) {
    if (this.stopping || !reservation.pk || this.processing.has(reservation.pk))
      return;
    const delay = reservation.sendAfter.getTime() - Date.now();
    if (delay > LOOKAHEAD_MS) {
      this.clearTimer(reservation.pk);
      return;
    }
    const existing = this.timers.get(reservation.pk);
    if (
      existing?.reservation.sendAfter.getTime() ===
      reservation.sendAfter.getTime()
    )
      return;
    this.clearTimer(reservation.pk);
    const handle = setTimeout(
      () => {
        this.timers.delete(reservation.pk);
        void this.runReservation(reservation.pk);
      },
      Math.max(0, delay),
    );
    this.timers.set(reservation.pk, { handle, reservation });
  }

  private runReservation(pk: string): Promise<void> {
    if (this.stopping) return Promise.resolve();
    const existing = this.processing.get(pk);
    if (existing) return existing;
    const work = this.popoService
      .processReservedPopoChatReservation(pk)
      .catch((error) => {
        // DB에 남은 예약이나 전달 작업은 이후 Cron 실행에서 재시도합니다.
        this.logger.error("Failed to process Popo reservation " + pk, error);
      })
      .finally(() => this.processing.delete(pk));
    this.processing.set(pk, work);
    return work;
  }

  private clearTimer(pk: string) {
    const timer = this.timers.get(pk);
    if (timer) clearTimeout(timer.handle);
    this.timers.delete(pk);
  }

  private cancelReservations(potPk: string, type?: PopoChatStringType) {
    for (const [pk, { reservation }] of this.timers) {
      if (
        reservation.potFk === potPk &&
        (!type || reservation.popoChatMsgType === type)
      ) {
        this.clearTimer(pk);
      }
    }
  }

  async onModuleDestroy() {
    this.stopping = true;
    this.subscriptions.unsubscribe();
    for (const pk of this.timers.keys()) this.clearTimer(pk);
    await this.refreshPromise?.catch(() => undefined);
    await this.deliveryPromise?.catch(() => undefined);
    await Promise.allSettled(this.processing.values());
  }
}
