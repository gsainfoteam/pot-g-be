import * as roomEventSchema from "../schema/room-event";
import * as userSchema from "../schema/user";

import { pgGenerate } from "drizzle-dbml-generator";

const out = "./drizzle/dbml/schema.dbml";
const relational = true;

pgGenerate({ schema: { ...roomEventSchema, ...userSchema }, out, relational });
