import { Injectable } from "@nestjs/common";
import { generateKeyPairSync } from "node:crypto";
import { JwtKeyPairRepository } from "@src/database/repository/jwt-key-pair.repository";

@Injectable()
export class KeyPairService {
  private jwtPublicKey: string;
  private jwtPrivateKey: string;

  constructor(private readonly jwtKeyPairRepository: JwtKeyPairRepository) {}

  async getKeyPair() {
    if (!this.jwtPublicKey || !this.jwtPrivateKey) {
      const keyPair = await this.jwtKeyPairRepository.getKeyPair();

      if (keyPair) {
        this.jwtPublicKey = keyPair.publicKey;
        this.jwtPrivateKey = keyPair.privateKey;
      } else {
        const { publicKey, privateKey } = generateKeyPairSync("rsa", {
          modulusLength: 2048,
          publicKeyEncoding: { type: "spki", format: "pem" },
          privateKeyEncoding: { type: "pkcs8", format: "pem" },
        });

        await this.jwtKeyPairRepository.saveKeyPair(publicKey, privateKey);

        this.jwtPublicKey = publicKey;
        this.jwtPrivateKey = privateKey;
      }
    }
    return {
      publicKey: this.jwtPublicKey,
      privateKey: this.jwtPrivateKey,
    };
  }
}
