import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as format from "string-format";
import { Trace } from "@gsainfoteam/nest-observability";
import { DatabaseService } from "@src/database/database.service";
import { FofoChatMsgAdminRepository } from "@src/admin-database/repository/fofo-chat-msg.admin.repository";
import { FofoChatMsgEntity } from "@src/database/entity/fofo-chat-msg.entity";
import { FofoService } from "@src/fofo/fofo.service";
import { FOFO_MESSAGE_META } from "@src/fofo/fofo-message-meta";
import { FofoChatStringType } from "../../drizzle/schema/fofo-chat-msg";
import { FofoMessageDto } from "@src/admin-fofo-message/dto/fofo-message.dto";
import { UpdateFofoMessageRequestDto } from "@src/admin-fofo-message/dto/update-fofo-message.dto";

@Trace()
@Injectable()
export class AdminFofoMessageService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly fofoChatMsgAdminRepository: FofoChatMsgAdminRepository,
    private readonly fofoService: FofoService,
  ) {}

  async list(): Promise<FofoMessageDto[]> {
    const entities = await this.fofoChatMsgAdminRepository.findAll();

    return entities
      .filter((entity) => Object.hasOwn(FOFO_MESSAGE_META, entity.type))
      .map((entity) => this.toDto(entity))
      .sort((a, b) => a.type.localeCompare(b.type));
  }

  async update(
    type: string,
    req: UpdateFofoMessageRequestDto,
  ): Promise<FofoMessageDto> {
    if (!Object.hasOwn(FOFO_MESSAGE_META, type)) {
      throw new NotFoundException("Fofo message not found");
    }
    const entity = await this.fofoChatMsgAdminRepository.findByType(
      type as FofoChatStringType,
    );
    if (!entity) {
      throw new NotFoundException("Fofo message not found");
    }

    const meta = FOFO_MESSAGE_META[entity.type];
    this.validateMessage(req.message, meta.variables);
    let offsetMinutes = entity.offsetMinutes;
    if (meta.timingAnchor !== null) {
      if (req.offset_minutes == null) {
        throw new BadRequestException(
          "offset_minutes is required for scheduled messages",
        );
      }
      if (
        entity.type === "fofo-delay-check-request-v1" &&
        req.offset_minutes >= 0
      ) {
        throw new BadRequestException(
          "offset_minutes must be negative for delay check messages",
        );
      }
      offsetMinutes = req.offset_minutes;
    }

    const updated = await this.dbService.db.transaction((tx) =>
      this.fofoChatMsgAdminRepository.update(
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
    await this.fofoService.reloadFofoChatMsgs();

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

  private toDto(entity: FofoChatMsgEntity): FofoMessageDto {
    const meta = FOFO_MESSAGE_META[entity.type];
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
