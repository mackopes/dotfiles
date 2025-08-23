return {
  -- Treesitter configuration with proper syntax highlighting
  {
    "nvim-treesitter/nvim-treesitter",
    opts = {
      -- Languages to automatically install
      ensure_installed = {
        "bash",
        "go", -- Added Go support
        "html",
        "javascript",
        "json",
        "lua",
        "markdown",
        "markdown_inline",
        "python",
        "query",
        "regex",
        "rust", -- Added Rust support
        "tsx",
        "typescript",
        "vim",
        "yaml",
        "glsl",
      },

      -- Don't install all parsers synchronously (only applies to `ensure_installed`)
      sync_install = false,

      -- Automatically install missing parsers when entering buffer
      auto_install = true,

      -- List of parsers to ignore installing
      ignore_install = {},

      -- Required field for proper treesitter config
      modules = {},

      -- Syntax highlighting configuration
      highlight = {
        enable = true,
        -- Disable vim regex highlighting to avoid conflicts
        additional_vim_regex_highlighting = false,
      },

      -- Smart indentation based on treesitter
      indent = {
        enable = true,
      },

      -- Incremental selection based on treesitter
      incremental_selection = {
        enable = true,
        keymaps = {
          init_selection = "<C-space>",
          node_incremental = "<C-space>",
          scope_incremental = "<C-s>",
          node_decremental = "<M-space>",
        },
      },

      -- Text objects based on treesitter
      textobjects = {
        select = {
          enable = true,
          -- Automatically jump forward to textobj, similar to targets.vim
          lookahead = true,
          keymaps = {
            -- You can use the capture groups defined in textobjects.scm
            ["af"] = "@function.outer",
            ["if"] = "@function.inner",
            ["ac"] = "@class.outer",
            ["ic"] = "@class.inner",
          },
        },
      },
    },
  },
}
