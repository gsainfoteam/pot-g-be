import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PotService } from "@src/pot/pot.service";
import { CreatePotReqDto, CreatePotResDto } from "@src/pot/dto/create.pot.dto";
import { UserGuard } from "@src/auth/guard/user.guard";
import { GetUser } from "@src/global/decorator/get-user.decorator";
import { UserContext } from "@src/auth/context/user-context.entity";
import { BaseResultDto } from "@src/global/dto/base-result.dto";
import { MyPotResDto } from "@src/pot/dto/my.pot.dto";
import { PotInfoDto } from "@src/pot/dto/pot.info.dto";
import {
  PotEventListReqDto,
  PotEventListResDto,
} from "@src/pot/dto/pot.event.dto";
import { PotOverviewDto } from "@src/pot/dto/pot.overview.dto";
import { ConfirmDepartureTimeDto } from "@src/pot/dto/confirm-departure-time.pot.dto";

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

  @Get("/me")
  @UseGuards(UserGuard)
  async getMyPot(@GetUser() userCtx: UserContext): Promise<MyPotResDto> {
    return this.potService.getMyPot(userCtx);
  }

  @Get("/:potPk/info")
  @UseGuards(UserGuard)
  async getPotInfo(
    @Param("potPk") potPk: string,
    @GetUser() userCtx: UserContext,
  ): Promise<PotInfoDto> {
    return this.potService.getPotInfo(potPk, userCtx);
  }

  @Get("/:potPk/overview")
  @UseGuards(UserGuard)
  async getPotOverview(@Param("potPk") potPk: string): Promise<PotOverviewDto> {
    return this.potService.getPotOverview(potPk);
  }

  @Get(":potPk/events")
  @UseGuards(UserGuard)
  async getPotEvents(
    @Param("potPk") potPk: string,
    @Query() req: PotEventListReqDto,
    @GetUser()
    userCtx: UserContext,
  ): Promise<PotEventListResDto> {
    return this.potService.getPotEvents(potPk, req, userCtx);
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
    @Body() req: ConfirmDepartureTimeDto,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.potService.confirmDepartureTime(potPk, req, userCtx);
  }
}
