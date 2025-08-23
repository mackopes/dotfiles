# If you come from bash you might have to change your $PATH.
# export PATH=$HOME/bin:/usr/local/bin:$PATH

# Path to your oh-my-zsh installation.
source ~/.antigen.zsh

# Load the oh-my-zsh's library.
antigen use oh-my-zsh

# Bundles from the default repo (robbyrussell's oh-my-zsh).
antigen bundle git
antigen bundle osx
antigen bundle cp
antigen bundle brew
antigen bundle python
antigen bundle z
antigen bundle pip
antigen bundle command-not-found
antigen bundle MichaelAquilina/zsh-you-should-use
# antigen bundle esc/conda-zsh-completion
antigen bundle autosuggestions

# Syntax highlighting bundle.
antigen bundle zsh-users/zsh-syntax-highlighting

# Load the theme.
antigen theme spaceship-prompt/spaceship-prompt

# Tell Antigen that you're done.
antigen apply

# Uncomment the following line to enable command auto-correction.
ENABLE_CORRECTION="false"

SPACESHIP_KUBECONTEXT_SHOW=false
SPACESHIP_TIME_SHOW=false
SPACESHIP_PYENV_SHOW=false
SPACESHIP_CONDA_SHOW=true
# SPACESHIP_DIR_TRUNC_REPO=false
SPACESHIP_RUBY_SHOW=false
SPACESHIP_NODE_SHOW=false
SPACESHIP_DOCKER_SHOW=false
SPACESHIP_KUBERNETES_SHOW=false
SPACESHIP_DOCKER_COMPOSE_SHOW=false
SPACESHIP_AWS_SHOW=false
SPACESHIP_GCLOUD_SHOW=false

unsetopt correct

autoload -Uz compinit
if [ "$(date +'%j')" != "$(stat -f '%Sm' -t '%j' ~/.zcompdump 2>/dev/null)" ]; then
    compinit
else
    compinit -C
fi

# >>> conda initialize >>>
# !! Contents within this block are managed by 'conda init' !!
__conda_setup="$('/opt/homebrew/Caskroom/miniforge/base/bin/conda' 'shell.zsh' 'hook' 2> /dev/null)"
if [ $? -eq 0 ]; then
    eval "$__conda_setup"
else
    if [ -f "/opt/homebrew/Caskroom/miniforge/base/etc/profile.d/conda.sh" ]; then
        . "/opt/homebrew/Caskroom/miniforge/base/etc/profile.d/conda.sh"
    else
        export PATH="/opt/homebrew/Caskroom/miniforge/base/bin:$PATH"
    fi
fi
unset __conda_setup
# <<< conda initialize <<<

# >>> conda initialize >>>
# !! Contents within this block are managed by 'conda init' !!
__conda_setup="$('/opt/homebrew/Caskroom/miniconda/base/bin/conda' 'shell.bash' 'hook' 2> /dev/null)"
if [ $? -eq 0 ]; then
    eval "$__conda_setup"
else
    if [ -f "/opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh" ]; then
        . "/opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh"
    else
        export PATH="/opt/homebrew/Caskroom/miniconda/base/bin:$PATH"
    fi
fi
unset __conda_setup
# <<< conda initialize <<<

# if conda exists
if [ -x "$(command -v conda)" ]; then
    # enable conda auto-activation
    conda config --set auto_activate_base false
fi

export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
export PATH="/Users/mackopes/.bin:$PATH"

# The next line updates PATH for the Google Cloud SDK.
if [ -f '/Users/mackopes/.gcloud/google-cloud-sdk/path.zsh.inc' ]; then . '/Users/mackopes/.gcloud/google-cloud-sdk/path.zsh.inc'; fi

# The next line enables shell command completion for gcloud.
if [ -f '/Users/mackopes/.gcloud/google-cloud-sdk/completion.zsh.inc' ]; then . '/Users/mackopes/.gcloud/google-cloud-sdk/completion.zsh.inc'; fi

# Add RVM to PATH for scripting. Make sure this is the last PATH variable change.
export PATH="$PATH:$HOME/.rvm/bin"

# This was added for workflow to manage nvm and node versions. I don't think I need this anymore.
# export NVM_DIR="$HOME/.nvm"
# [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
# [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

export PATH="$PATH:/Users/mp/.local/bin"
export PATH="$(brew --prefix python)/libexec/bin:$PATH"

# Aliases
alias zshconfig="nvim ~/.zshrc"
alias sshconfig="nvim ~/.ssh/config"
alias lg="lazygit"
alias sayl="say -v Laura"
alias rake="bundle exec rake"

