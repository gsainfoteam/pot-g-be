import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { AdminNotificationService } from
  "./admin-notification.service";
import { DelayCheckPolicyDto } from
  "./dto/delay-check-policy.dto";
import { UpdateDelayCheckPolicyDto } from
  "./dto/update-delay-check-policy.dto";

@Controller("/api/manager/v1/notification")
@UseGuards(ManagerGuard)
export class AdminNotificationController {
  constructor(
    private readonly adminNotificationService: AdminNotificationService,
  ) {}

  @Get("/delay-check")
  async getDelayCheckPolicy(): Promise<DelayCheckPolicyDto> {
    return this.adminNotificationService.getDelayCheckPolicy();
  }

  @Patch("/delay-check")
  async updateDelayCheckPolicy(
    @Body() req: UpdateDelayCheckPolicyDto,
  ): Promise<DelayCheckPolicyDto> {
    return this.adminNotificationService.updateDelayCheckPolicy(req);
  }
}