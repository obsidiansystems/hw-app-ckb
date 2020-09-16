{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  nativeBuildInputs = with pkgs.buildPackages; [
    nodejs yarn pkg-config python
    nodePackages.node-gyp
    #nodePackages.babel
  ];
  buildInputs = with pkgs; [
    libusb
  ];
}
