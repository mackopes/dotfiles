#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
echo "source $DIR/.vimrc" > ~/.vimrc

curl https://raw.githubusercontent.com/JDevlieghere/dotfiles/master/.vim/.ycm_extra_conf.py > ~/.vim/.ycm_extra_conf.py
