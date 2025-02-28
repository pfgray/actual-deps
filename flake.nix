{
  description = "Analyzes packages to find their actual dependencies";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-22.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
      actual-deps = pkgs.callPackage ./. {};
    in {
      devShell = pkgs.mkShell {
        packages = [
          # bun.packages.${system}.v0_1_6
          pkgs.nodejs
        ];
      };
      packages = {
        actual-deps = actual-deps.build;
        default = actual-deps.build;
      };
      apps.actual-deps = flake-utils.lib.mkApp {
        drv = actual-deps.build;
      };
    });
}
