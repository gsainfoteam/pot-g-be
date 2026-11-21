import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { DelayCheckPolicyAdminRepository } from
  "@src/admin-database/repository/delay-check-policy.admin.repository";
import { DelayCheckPolicyDto } from
  "./dto/delay-check-policy.dto";
import { UpdateDelayCheckPolicyDto } from
  "./dto/update-delay-check-policy.dto";

@Injectable()
export class AdminNotificationService {
  constructor(
    private readonly policyRepository: DelayCheckPolicyAdminRepository,
  ) {}

  async getDelayCheckPolicy(): Promise<DelayCheckPolicyDto> {
    const policy = await this.policyRepository.find();

    if (!policy) {
      throw new InternalServerErrorException(
        "Delay check policy is not initialized",
      );
    }

    return {
      enabled: policy.enabled,
      minutes_before_departure: policy.minutesBeforeDeparture,
      updated_at: policy.updatedAt.toISOString(),
    };
  }

  async updateDelayCheckPolicy(
    req: UpdateDelayCheckPolicyDto,
  ): Promise<DelayCheckPolicyDto> {
    const policy = await this.policyRepository.save({
      enabled: req.enabled,
      minutesBeforeDeparture: req.minutes_before_departure,
    });

    return {
      enabled: policy.enabled,
      minutes_before_departure: policy.minutesBeforeDeparture,
      updated_at: policy.updatedAt.toISOString(),
    };
  }
}