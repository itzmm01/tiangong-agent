#!/bin/bash

name="tiangong-agent"
home_dir=`pwd`

systemctl disable ${name} --now
rm -f /usr/lib/systemd/system/${name}.service
rm -rf ../$name
