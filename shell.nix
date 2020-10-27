let
  nixpkgs = builtins.fetchTarball {
    url = https://releases.nixos.org/nixpkgs/nixpkgs-21.03pre246624.cfed29bfcb2/nixexprs.tar.xz;
    sha256 = "1xrvf9j9kjlc768a4z323n2b3lf3c65dvp5qkzgisdwmz14h88rz";
  };
in
{ pkgs ? import nixpkgs {} }:
pkgs.mkShell {
  nativeBuildInputs = with pkgs.buildPackages; [
    pkg-config python
    nodejs
    (yarn.override { nodejs = nodejs; })
    nodePackages.node-gyp
  ];
  buildInputs = with pkgs; [
    libusb
  ];
}
