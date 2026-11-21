import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as format from "string-format";
import { Trace } from "@gsainfoteam/nest-observability";
import { DatabaseService } from "@src/database/database.service";
import { PopoChatMsgAdminRepository } from "@src/admin-database/repository/popo-chat-msg.admin.repository";
import { PopoChatMsgEntity } from "@src/database/entity/popo-chat-msg.entity";
import { PopoService } from "@src/popo/popo.service";
import { POPO_MESSAGE_META } from "@src/popo/popo-message-meta";
import { PopoChatStringType } from "../../drizzle/schema/popo-chat-msg";
import { PopoMessageDto } from "@src/admin-popo-message/dto/popo-message.dto";
import { UpdatePopoMessageRequestDto } from "@src/admin-popo-message/dto/update-popo-message.dto";

@Trace()
@Injectable()
export class AdminPopoMessageService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly popoChatMsgAdminRepository: PopoChatMsgAdminRepository,
    private readonly popoService: PopoService,
  ) {}

  async list(): Promise<PopoMessageDto[]> {
    const entities = await this.popoChatMsgAdminRepository.findAll();

    return entities
      .filter((entity) => Object.hasOwn(POPO_MESSAGE_META, entity.type))
      .map((entity) => this.toDto(entity))
      .sort((a, b) => a.type.localeCompare(b.type));
  }

  async update(
    type: string,
    req: UpdatePopoMessageRequestDto,
  ): Promise<PopoMessageDto> {
    if (!Object.hasOwn(POPO_MESSAGE_META, type)) {
      throw new NotFoundException("Popo message not found");
    }
    const entity = await this.popoChatMsgAdminRepository.findByType(
      type as PopoChatStringType,
    );
    if (!entity) {
      throw new NotFoundException("Popo message not found");
    }

    const meta = POPO_MESSAGE_META[entity.type];
    this.validateMessage(req.message, meta.variables);
    let offsetMinutes = entity.offsetMinutes;
    if (meta.timingAnchor !== null) {
      if (req.offset_minutes == null) {
        throw new BadRequestException(
          "offset_minutes is required for scheduled messages",
        );
      }
      if (
        entity.type === "popo-delay-check-request-v1" &&
        req.offset_minutes >= 0
      ) {
        throw new BadRequestException(
          "offset_minutes must be negative for delay check messages",
        );
      }
      offsetMinutes = req.offset_minutes;
    }

    const updated = await this.dbService.db.transaction((tx) =>
      this.popoChatMsgAdminRepository.update(
        {
          ...entity,
          message: req.message,
          enabled: req.enabled,
          offsetMinutes,
          updatedAt: new Date(),
        },
        tx,
      ),
    );
    await this.popoService.reloadPopoChatMsgs();

    return this.toDto(updated);
  }

  /** 발송 시 포맷팅에 실패할 문구를 저장 전에 걸러낸다. */
  private validateMessage(message: string, variables: { name: string }[]) {
    const sample = Object.fromEntries(variables.map((v) => [v.name, "x"]));
    try {
      format(message, sample);
    } catch {
      throw new BadRequestException("message has an invalid placeholder");
    }
  }

  private toDto(entity: PopoChatMsgEntity): PopoMessageDto {
    const meta = POPO_MESSAGE_META[entity.type];
    return {
      type: entity.type,
      title: meta.title,
      description: meta.description,
      message: entity.message,
      action_btns: entity.actionBtns,
      variables: meta.variables,
      enabled: entity.enabled,
      timing_anchor: meta.timingAnchor,
      offset_minutes: entity.offsetMinutes,
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}
