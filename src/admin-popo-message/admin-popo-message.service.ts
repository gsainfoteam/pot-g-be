import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
      .filter((entity) => entity.type in POPO_MESSAGE_META)
      .map((entity) => this.toDto(entity))
      .sort((a, b) => a.type.localeCompare(b.type));
  }

  async update(
    type: string,
    req: UpdatePopoMessageRequestDto,
  ): Promise<PopoMessageDto> {
    if (!(type in POPO_MESSAGE_META)) {
      throw new NotFoundException("Popo message not found");
    }
    const entity = await this.popoChatMsgAdminRepository.findByType(
      type as PopoChatStringType,
    );
    if (!entity) {
      throw new NotFoundException("Popo message not found");
    }

    const meta = POPO_MESSAGE_META[entity.type];
    let offsetMinutes = entity.offsetMinutes;
    if (meta.timingAnchor !== null) {
      if (req.offset_minutes == null) {
        throw new BadRequestException(
          "offset_minutes is required for scheduled messages",
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
