#!/bin/bash

to_deploy=($(ls -l | grep -E "^d" | cut -d' ' -f 10))

for i in ${to_deploy[@]}; do
  if [ -f $i/deploy.sh ]; then
    echo "deploying $i"
    $i/deploy.sh
  fi
done
