#!/bin/bash
set -e
set -x
sed -i -e 's/\(^deb cdrom.*$\)/#\1/g' /etc/apt/source.list
apt update
apt install -y sudo && usermod -aG sudo gz
apt install -y apt-transport-https lightdm openbox x11-xserver-utils rxvt-unicode-256color tmux dbus-x11 wmctrl synapse fonts-noto fonts-noto-cjk
apt install -y build-essential linux-headers-$(uname -r)

#chrome
wget -qO - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' > /etc/apt/sources.list.d/google-chrome.list
apt update
apt install -y google-chrome-stable

#docker
wget -qO - https://download.docker.com/linux/debian/gpg | sudo apt-key add -
echo "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list

#dev tools
apt install -y git vim curl