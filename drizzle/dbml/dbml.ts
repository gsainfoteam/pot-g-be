import * as usersSchema from "../schema/users";
import * as userPotRoomSchema from "../schema/user-pot-room";
import * as potRoomSchema from "../schema/pot-room";
import * as potEventSchema from "../schema/pot-event";
import * as userAlarmSettingSchema from "../schema/user-alarm-setting";
import * as routeSchema from "../schema/route";
import * as deviceSchema from "../schema/device";
import * as bankSchema from "../schema/bank";
import * as userBankSchema from "../schema/user-bank";
import * as jwtKeyPairSchema from "../schema/jwt-key-pair";

import { pgGenerate } from "drizzle-dbml-generator";

const out = "./drizzle/dbml/schema.dbml";
const relational = true;

pgGenerate({
  schema: {
    ...usersSchema,
    ...userPotRoomSchema,
    ...potRoomSchema,
    ...potEventSchema,
    ...userAlarmSettingSchema,
    ...routeSchema,
    ...deviceSchema,
    ...bankSchema,
    ...userBankSchema,
    ...jwtKeyPairSchema,
  },
  out,
  relational,
});
