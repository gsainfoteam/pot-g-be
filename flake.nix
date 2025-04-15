{
  description = "PotG Environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs";

  outputs = { self, nixpkgs }: 
  let
    pkgs = import nixpkgs { system = "aarch64-darwin"; };
    bun = pkgs.bun;
  in {
    devShells.aarch64-darwin.default = pkgs.mkShell {
      buildInputs = [
        bun
      ];
      
      shellHook = ''
        echo "PotG 환경으로 진입했습니다."
        echo "Bun $(${bun}/bin/bun --version) 환경으로 진입했습니다."
      '';
    };
  };
}

