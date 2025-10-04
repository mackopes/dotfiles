# If you come from bash you might have to change your $PATH.
# export PATH=$HOME/bin:/usr/local/bin:$PATH

# Path to your oh-my-zsh installation.
source ~/.antigen.zsh

# Load the oh-my-zsh's library.
antigen use oh-my-zsh

# Bundles from the default repo (robbyrussell's oh-my-zsh).
antigen bundle git
antigen bundle osx
{{#if (eq os "macos")}}
antigen bundle cp
{{/if}}
antigen bundle brew
antigen bundle python
antigen bundle z
antigen bundle pip
antigen bundle command-not-found
antigen bundle MichaelAquilina/zsh-you-should-use
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

# Aliases
alias zshconfig="nvim ~/.zshrc"
alias sshconfig="nvim ~/.ssh/config"
alias lg="lazygit"

{{#if (eq os "macos")}}
source ~/.zshrc.d/zshrc_mac
{{/if}}

{{#if (eq os "linux")}}
source ~/.zshrc.d/zshrc_linux
{{/if}}

