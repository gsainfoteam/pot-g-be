import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { PotService } from "@src/pot/pot.service";
import { CreatePotReqDto, CreatePotResDto } from "@src/pot/dto/create.pot.dto";
import { UserGuard } from "@src/auth/guard/user.guard";
import { GetUser } from "@src/global/decorator/get-user.decorator";
import { UserContext } from "@src/auth/user-context.entity";
import { BaseResultDto } from "@src/global/dto/base-result.dto";

@Controller("/api/v1/pot")
export class PotController {
  constructor(private readonly potService: PotService) {}

  @Post("/create")
  @UseGuards(UserGuard)
  async createPot(
    @Body() req: CreatePotReqDto,
    @GetUser() userCtx: UserContext,
  ): Promise<CreatePotResDto> {
    return this.potService.createPot(req, userCtx);
  }

  @Post("/:potPk/in")
  @UseGuards(UserGuard)
  async enterPot(
    @Param("potPk") potPk: string,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.potService.enterPot(potPk, userCtx);
  }

  @Post("/:potPk/out")
  @UseGuards(UserGuard)
  async leavePot(
    @Param("potPk") potPk: string,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.potService.leavePot(potPk, userCtx);
  }

  @Post("/:potPk/kick")
  @UseGuards(UserGuard)
  async kickUserFromPot(
    @Param("potPk") potPk: string,
    @Body("user_id") targetUserId: string,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.potService.kickUserFromPot(potPk, targetUserId, userCtx);
  }

  @Post("/:potPk/departure/confirm")
  @UseGuards(UserGuard)
  async confirmDepartureTime(
    @Param("potPk") potPk: string,
    @Body("departure_time") departureTime: Date,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.potService.confirmDepartureTime(potPk, departureTime, userCtx);
  }
}
