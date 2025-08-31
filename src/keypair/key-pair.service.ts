import { Injectable } from "@nestjs/common";
import { JwtKeyPairRepository } from "@src/keypair/jwt-key-pair.repository";

@Injectable()
export class KeyPairService {
  private jwtPublicKey: string;
  private jwtPrivateKey: string;

  constructor(private readonly jwtKeyPairRepository: JwtKeyPairRepository) {}

  async getKeyPair() {
    if (!this.jwtPublicKey || !this.jwtPrivateKey) {
      const { publicKey, privateKey } =
        await this.jwtKeyPairRepository.getKeyPair();
      this.jwtPublicKey = publicKey;
      this.jwtPrivateKey = privateKey;
    }
    return {
      publicKey: this.jwtPublicKey,
      privateKey: this.jwtPrivateKey,
    };
  }
}
