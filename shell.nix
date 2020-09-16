{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  nativeBuildInputs = with pkgs.buildPackages; [
    pkg-config python
    nodejs-12_x
    (yarn.override { nodejs = nodejs-12_x; })
    nodePackages_12_x.node-gyp
    #nodePackages_12_x.babel
  ];
  buildInputs = with pkgs; [
    libusb
  ];
}
