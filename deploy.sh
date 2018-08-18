#!/bin/bash

to_deploy=($(ls -l | grep -E "^d" | cut -d' ' -f 9))

for i in ${to_deploy[@]}; do
  if [ -f $i/deploy.sh ]; then
    $i/deploy.sh
  fi
done
