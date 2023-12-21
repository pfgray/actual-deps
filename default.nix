{yarn2nix, mkYarnPackage, ...}: 
{
  build = mkYarnPackage rec {
    name = "actual-deps";
    src = ./.;
    packageJSON = ./package.json;
    yarnLock = ./yarn.lock;
    distPhase = ''
      # pack command ignores cwd option
      rm -f .yarnrc
      cd $out/libexec/${name}/deps/${name}
      mkdir -p $out/tarballs/
      yarn pack --offline --filename $out/tarballs/actual-deps.tgz
      chmod +x $out/bin/actual-deps
    '';
  };
}