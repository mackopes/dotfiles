return {
  -- Trouble configuration
  {
    "folke/trouble.nvim",
    opts = {}, -- use default options
    keys = {
      -- Workspace diagnostics (all severities)
      {
        "<leader>xW",
        "<cmd>Trouble diagnostics toggle<cr>",
        desc = "Workspace Diagnostics (Trouble)",
      },
      -- Workspace errors only
      {
        "<leader>xE",
        "<cmd>Trouble diagnostics toggle filter.severity=ERROR<cr>",
        desc = "Workspace Errors (Trouble)",
      },
      -- Buffer diagnostics
      {
        "<leader>xb",
        "<cmd>Trouble diagnostics toggle filter.buf=0<cr>",
        desc = "Buffer Diagnostics (Trouble)",
      },
      -- Buffer errors only
      {
        "<leader>xe",
        "<cmd>Trouble diagnostics toggle filter.buf=0 filter.severity=ERROR<cr>",
        desc = "Buffer Errors (Trouble)",
      },
    },
  },

  -- LSP diagnostic configuration (VSCode-like hover)
  {
    "neovim/nvim-lspconfig",
    opts = {
      -- Disable virtual text, keep only underlines
      diagnostics = {
        virtual_text = false,
      },
    },
    init = function()
      -- Configure diagnostic display
      vim.diagnostic.config({
        virtual_text = true,
        signs = true, -- Keep gutter signs
        underline = true, -- Keep underlines
        update_in_insert = false,
        severity_sort = true,
        float = {
          border = "rounded",
          source = "always",
          header = "",
          prefix = "",
        },
      })

      -- Show on hover
      vim.api.nvim_create_autocmd("CursorHold", {
        callback = function()
          vim.diagnostic.open_float(nil, {
            focusable = false,
            close_events = { "BufLeave", "CursorMoved", "InsertEnter", "FocusLost" },
            border = "rounded",
            source = "always",
            prefix = " ",
            anchor_bias = "above",
          })
        end,
      })

      -- Set hover delay
      vim.opt.updatetime = 250
    end,
  },
}
