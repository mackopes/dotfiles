set colorcolumn=120
set ruler
set tabstop=4
set expandtab
set softtabstop=2
set shiftwidth=2
set shiftround
set relativenumber
set autoindent
filetype indent on
syntax on
set belloff=all
set cursorline
set showcmd
set wildmenu
set lazyredraw
set ttimeoutlen=10
set encoding=UTF-8

" Key remaps
" NEDTToggle remap
noremap <leader>f :NERDTreeToggle<enter>

" tab scrolling
nnoremap tk :tabnext<CR>
nnoremap tj :tabprevious<CR>
nnoremap th :tabfirst<CR>
nnoremap tl :tablast<CR>

" format code
nnoremap <leader>g :ClangFormat<enter>
vnoremap <leader>g :ClangFormat<enter>

nnoremap gf :YcmCompleter GoToDefinition<CR>
nnoremap gd :YcmCompleter GoToDeclaration<CR>

" FixIt
nnoremap <leader>r :YcmCompleter FixIt<enter>

" NERDTree settings
let NERDTreeMinimalUI = 1
let NERDTreeDirArrows = 1

syntax enable
if has("unix")
  let s:uname = system("echo -n \"$(uname)\"")
  if !v:shell_error && s:uname == "Linux"
      set background=dark
      colorscheme solarized
      " set correct colorscheme for vim
      set t_Co=256
      " let g:solarized_termcolors=256
      let g:solarized_termtrans = 1
    endif
endif

" set the runtime path to include Vundle and initialize
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

" let Vundle manage Vundle, required
Plugin 'VundleVim/Vundle.vim'

" YouCompleteMe Plugin
Plugin 'Valloric/YouCompleteMe'

" Track the engine.
Plugin 'SirVer/ultisnips'

" Snippets are separated from the engine. Add this if you want them:
Plugin 'honza/vim-snippets'

" C++ syntax hightlithing
Plugin 'bfrg/vim-cpp-modern'

" NERDTree
Plugin 'scrooloose/nerdtree'

" NERD Commenter
Plugin 'scrooloose/nerdcommenter'

" AutoClose Brackets
Plugin 'spf13/vim-autoclose'

" CLang formatter
Plugin 'rhysd/vim-clang-format'

" Tab completions with supertab
Plugin 'ervandew/supertab'

" Nice status bar
Plugin 'bling/vim-airline'
Plugin 'vim-airline/vim-airline-themes'

" All of your Plugins must be added before the following line
call vundle#end()            " required
filetype plugin indent on    " required
" To ignore plugin indent changes, instead use:
"filetype plugin on

" YouCompleteMe settings
" default ycm conf
let g:ycm_global_ycm_extra_conf = "~/.vim/bundle/YouCompleteMe/third_party/ycmd/cpp/ycm/.ycm_extra_conf.py"

" semantic completion after each insertion
let g:ycm_semantic_triggers = { 'cpp': [ 're!.' ], 'c': ['re!.'] }

" autoclose preview window after editing
" let g:ycm_autoclose_preview_window_after_completion = 1
let g:ycm_autoclose_preview_window_after_insertion = 1

" Limit the number of suggestions given by ycm
let g:ycm_max_num_candidates = 20

" make YCM compatible with UltiSnips (using supertab)
let g:ycm_key_list_select_completion = ['<C-n>', '<Down>']
let g:ycm_key_list_previous_completion = ['<C-p>', '<Up>']
let g:SuperTabDefaultCompletionType = '<C-n>'

" better key bindings for UltiSnipsExpandTrigger
let g:UltiSnipsExpandTrigger = "<tab>"
let g:UltiSnipsJumpForwardTrigger = "<tab>"
let g:UltiSnipsJumpBackwardTrigger = "<s-tab>"

" airline theme
let g:airline_theme='murmur'
let g:airline_solarized_bg='dark'
let g:airline_powerline_fonts = 1


