#!/bin/bash

to_deploy=($(ls -l | grep -E "^d" | rev | cut -d' ' -f 1 | rev))

for i in ${to_deploy[@]}; do
  if [ -f $i/deploy.sh ]; then
    echo "deploying $i"
    $i/deploy.sh
  fi
done
