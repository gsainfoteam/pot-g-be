import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { PotService } from "@src/pot/pot.service";
import { CreatePotReqDto, CreatePotResDto } from "@src/pot/dto/create.pot.dto";
import { UserGuard } from "@src/auth/guard/user.guard";
import { GetUser } from "@src/global/decorator/get-user.decorator";
import { UserContext } from "@src/auth/user-context.entity";

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
}
