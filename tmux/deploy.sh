#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
echo "source $DIR/.tmux.conf" > ~/.tmux.conf
