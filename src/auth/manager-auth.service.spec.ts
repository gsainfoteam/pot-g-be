import { Test, TestingModule } from "@nestjs/testing";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { ManagerAuthService } from "@src/auth/manager-auth.service";
import { KeyPairService } from "@src/keypair/key-pair.service";
import { KeyPairModule } from "@src/keypair/key-pair.module";
import { DatabaseModule } from "@src/database/database.module";

describe("ManagerAuthService", () => {
  let service: ManagerAuthService;
  let jwtService: JwtService;
  let keyPairService: KeyPairService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ".env",
        }),
        JwtModule.register({}),
        KeyPairModule,
        DatabaseModule,
      ],
      providers: [ManagerAuthService],
    }).compile();

    service = module.get<ManagerAuthService>(ManagerAuthService);
    jwtService = module.get<JwtService>(JwtService);
    keyPairService = module.get<KeyPairService>(KeyPairService);
  });

  afterAll(async () => {
    await module.close();
  });

  it("should create and verify JWT token", async () => {
    // Arrange
    const email = "manager@gistory.me";

    // Act - Generate token
    const result = await service.createNewJwtToken(email);

    // Print generated token
    console.log("\n=== Generated JWT Token ===");
    console.log(result.accessToken);
    console.log("===========================\n");

    // Assert - Token is created
    expect(result).toBeDefined();
    expect(result.accessToken).toBeDefined();

    // Act - Verify token with jwtService
    const { publicKey } = await keyPairService.getKeyPair();
    const payload = jwtService.verify(result.accessToken, {
      publicKey: publicKey,
      algorithms: ["RS256"],
    });

    // Assert - Payload is correct
    expect(payload.email).toBe(email);
    expect(payload.iss).toBe("PotG-Manager");
  });
});
