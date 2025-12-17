return {
  -- Catppuccin with enhanced colors for color vision deficiency
  {
    "catppuccin/nvim",
    name = "catppuccin",
    -- TODO: Remove version=false once catppuccin releases v1.12.0+ with special/bufferline module
    -- Using main branch because LazyVim requires catppuccin.special.bufferline which isn't in v1.11.0 yet
    -- See: https://github.com/catppuccin/nvim/issues/934
    version = false,
    priority = 1000,
    opts = {
      flavour = "macchiato", -- Back to macchiato flavor
      background = {
        light = "latte",
        dark = "macchiato", -- Using macchiato
      },
      transparent_background = false,
      show_end_of_buffer = false,
      term_colors = true,
      no_italic = false,
      no_bold = false,
      no_underline = false,
      styles = {
        comments = { "italic" },
        conditionals = { "bold" }, -- Keep bold for keywords like 'if'
        loops = { "bold" }, -- Keep bold for keywords like 'for'
        functions = { "italic" }, -- Changed to italic instead of bold
        keywords = { "bold" }, -- Keep bold for keywords like 'new', 'const'
        strings = {},
        variables = {},
        numbers = {},
        booleans = {},
        properties = {},
        types = {},
        operators = {},
      },
      custom_highlights = function(colors)
        return {
          -- Make comments more visible but still subtle
          Comment = { fg = colors.overlay1, style = { "italic" } },

          -- Brighter line numbers
          LineNr = { fg = colors.surface2 },
          CursorLineNr = { fg = colors.lavender, style = { "bold" } },

          -- More visible cursor line
          CursorLine = { bg = colors.surface0 },

          -- Brighter search highlights
          Search = { bg = colors.yellow, fg = colors.base },
          IncSearch = { bg = colors.peach, fg = colors.base },

          -- Enhanced syntax highlighting for better distinction
          -- HTML built-in tags (div, span, etc.) - keep these bold
          ["@tag.builtin"] = { fg = colors.red, style = {} },
          -- Custom JSX components (MyComponent) - NOT bold
          ["@tag"] = { fg = colors.lavender, style = {} },
          -- Angle brackets around HTML/JSX tags (< and >)
          ["@tag.delimiter"] = { fg = colors.red },
          -- HTML/JSX attributes (e.g., className, onClick)
          ["@tag.attribute"] = { fg = colors.blue },

          -- JavaScript/TypeScript specific
          -- Keywords like 'const', 'let', 'var', 'new', 'class'
          ["@keyword"] = { fg = colors.mauve, style = { "bold" } },
          -- Function-related keywords like 'function', 'async'
          ["@keyword.function"] = { fg = colors.mauve },
          -- Return statements
          ["@keyword.return"] = { fg = colors.pink },
          -- Function definitions and declarations
          ["@function"] = { fg = colors.blue, style = { "italic" } },
          -- Function calls (e.g., console.log(), myFunction())
          ["@function.call"] = { fg = colors.sky, style = { "italic" } },
          -- Regular variables
          ["@variable"] = { fg = colors.text },
          -- Function parameters (e.g., function myFunc(param1, param2))
          ["@variable.parameter"] = { fg = colors.orange }, -- Distinct color for parameters
          -- Object properties (e.g., obj.property)
          ["@property"] = { fg = colors.teal },
          -- String literals
          ["@string"] = { fg = colors.green },
          -- Number literals
          ["@number"] = { fg = colors.peach },
          -- Boolean values (true, false)
          ["@boolean"] = { fg = colors.peach },
          -- Constants and UPPER_CASE variables
          ["@constant"] = { fg = colors.yellow },
          -- Type annotations (TypeScript)
          ["@type"] = { fg = colors.yellow },
          -- Built-in types (string, number, boolean, etc.)
          ["@type.builtin"] = { fg = colors.yellow },

          -- Operators and punctuation
          -- Arithmetic operators (+, -, *, /, etc.)
          ["@operator"] = { fg = colors.sky },
          -- Brackets, braces, parentheses
          ["@punctuation.bracket"] = { fg = colors.overlay2 },
          -- Commas, semicolons, dots
          ["@punctuation.delimiter"] = { fg = colors.overlay2 },

          -- Component names (React components, class constructors) - NOT bold
          ["@constructor"] = { fg = colors.lavender, style = {} },

          -- Enhanced diagnostics
          DiagnosticError = { fg = colors.red },
          DiagnosticWarn = { fg = colors.yellow },
          DiagnosticInfo = { fg = colors.sky },
          DiagnosticHint = { fg = colors.teal },

          -- Trouble highlights
          TroubleText = { fg = colors.text },
          TroubleCount = { fg = colors.mauve, bg = colors.surface1 },
          TroubleNormal = { fg = colors.text, bg = colors.base },

          -- Additional highlights for better distinction
          -- Variable names and identifiers
          Identifier = { fg = colors.lavender },
          -- Function names (legacy vim syntax)
          Function = { fg = colors.blue, style = { "italic" } },
          -- General statements (legacy vim syntax)
          Statement = { fg = colors.mauve, style = { "bold" } },
          -- If/else statements (legacy vim syntax)
          Conditional = { fg = colors.red, style = { "bold" } },
          -- For/while loops (legacy vim syntax)
          Repeat = { fg = colors.red, style = { "bold" } },
          -- Labels and goto statements
          Label = { fg = colors.peach },
          -- Mathematical and logical operators
          Operator = { fg = colors.sky },
          -- General keywords (legacy vim syntax)
          Keyword = { fg = colors.pink, style = { "bold" } },
          -- Exception handling (try, catch, throw)
          Exception = { fg = colors.peach, style = { "bold" } },
          -- Preprocessor directives
          PreProc = { fg = colors.pink },
          -- Import/include statements
          Include = { fg = colors.pink, style = { "bold" } },
          -- #define statements
          Define = { fg = colors.pink },
          -- Macro definitions
          Macro = { fg = colors.pink },
          -- Type definitions (class, struct, interface)
          Type = { fg = colors.yellow },
          -- Storage class keywords (static, const, etc.)
          StorageClass = { fg = colors.yellow, style = { "bold" } },
          -- Structure definitions
          Structure = { fg = colors.yellow },
          -- Typedef statements
          Typedef = { fg = colors.yellow },
          -- Special characters and escape sequences
          Special = { fg = colors.blue },
          -- Special characters within strings
          SpecialChar = { fg = colors.blue },
          -- HTML/XML tags (legacy vim syntax) - for built-in HTML elements
          Tag = { fg = colors.red, style = { "bold" } },
          -- Delimiters (legacy vim syntax)
          Delimiter = { fg = colors.overlay2 },
          -- Special comments (TODO, FIXME, etc.)
          SpecialComment = { fg = colors.sky },
          -- Debug statements
          Debug = { fg = colors.sky },
        }
      end,
      integrations = {
        cmp = true,
        gitsigns = true,
        nvimtree = true,
        treesitter = true,
        notify = true,
        mini = {
          enabled = true,
          indentscope_color = "",
        },
        native_lsp = {
          enabled = true,
          virtual_text = {
            errors = { "italic" },
            hints = { "italic" },
            warnings = { "italic" },
            information = { "italic" },
          },
          underlines = {
            errors = { "underline" },
            hints = { "underline" },
            warnings = { "underline" },
            information = { "underline" },
          },
          inlay_hints = {
            background = true,
          },
        },
        telescope = {
          enabled = true,
        },
        which_key = true,
      },
    },
    config = function(_, opts)
      -- Setup catppuccin
      require("catppuccin").setup(opts)

      -- Apply colorscheme
      vim.cmd.colorscheme("catppuccin-macchiato")

      -- Additional vim settings for better appearance
      vim.opt.termguicolors = true

      -- Ensure proper terminal detection
      if vim.fn.has("termguicolors") == 1 then
        vim.opt.termguicolors = true
      end

      -- Set terminal type for kitty
      if vim.env.TERM == "xterm-kitty" then
        vim.env.TERM = "xterm-kitty"
      end

      -- Better syntax highlighting
      vim.opt.syntax = "on"
      vim.opt.synmaxcol = 300 -- Limit syntax highlighting for performance

      -- UI improvements
      vim.opt.pumblend = 10 -- Popup menu transparency
      vim.opt.winblend = 10 -- Window transparency

      -- Ensure font rendering looks good
      if vim.fn.has("gui_running") == 0 then
        -- Terminal-specific settings
        vim.opt.guicursor = "n-v-c:block,i-ci-ve:ver25,r-cr:hor20,o:hor50"
          .. ",a:blinkwait700-blinkoff400-blinkon250-Cursor/lCursor"
          .. ",sm:block-blinkwait175-blinkoff150-blinkon175"
      end

      -- Additional highlight adjustments for better contrast
      -- HTML tag names (legacy vim syntax support)
      vim.api.nvim_set_hl(0, "htmlTag", { fg = "#f38ba8", bold = true })
      vim.api.nvim_set_hl(0, "htmlEndTag", { fg = "#f38ba8", bold = true })
      vim.api.nvim_set_hl(0, "htmlTagName", { fg = "#f38ba8", bold = true })
      -- HTML attributes (legacy vim syntax support)
      vim.api.nvim_set_hl(0, "htmlArg", { fg = "#89b4fa" })

      -- Configure whitespace characters (faint tiny dots)
      vim.opt.list = true
      vim.opt.listchars = {
        space = "·", -- Show spaces as tiny dots
        tab = "→ ", -- Show tabs with arrow
        -- eol removed per user request
        trail = "⋅", -- Show trailing spaces
        extends = "❯", -- Show when line extends beyond screen
        precedes = "❮", -- Show when line precedes beyond screen
        nbsp = "␣", -- Show non-breaking spaces
      }

      -- Make whitespace characters blend almost completely with background (macchiato)
      vim.api.nvim_set_hl(0, "Whitespace", { fg = "#1e2030" }) -- Almost invisible, blends with background
      vim.api.nvim_set_hl(0, "NonText", { fg = "#1e2030" }) -- Almost invisible, blends with background
    end,
  },

  -- Configure LazyVim to load catppuccin
  {
    "LazyVim/LazyVim",
    opts = {
      colorscheme = "catppuccin-macchiato",
    },
  },
}
