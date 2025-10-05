import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PopoService } from "@src/popo/popo.service";

@Injectable()
export class PopoSchedulerService {
  private readonly logger = new Logger(PopoSchedulerService.name);

  constructor(private readonly popoService: PopoService) {}

  /* TODO
  후추 서버가 늘어날 경우 config 등을 사용하여 한 서버에서만 이 스케쥴러가 동작하도록 해야 함
  */
  @Cron("0 */5 * * * *") // Every 5 minutes
  async handleCron() {
    this.logger.log("Running Popo Scheduler");
    await this.popoService.processReservedPopoChatMsg();
  }
}
