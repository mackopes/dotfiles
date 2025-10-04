return {
  "lewis6991/gitsigns.nvim",
  opts = {
    current_line_blame = true,
    current_line_blame_opts = {
      virt_text = true,
      virt_text_pos = "eol",
      delay = 500,
      ignore_whitespace = false,
      virt_text_priority = 100,
    },
    -- Use relative time format!
    current_line_blame_formatter = "    <author>, <author_time:%R> - <summary>",
    current_line_blame_formatter_opts = {
      relative_time = true, -- This enables "2 days ago" format!
    },
  },
  config = function(_, opts)
    require("gitsigns").setup(opts)
    -- Make the blame text more visible with custom highlighting
    vim.api.nvim_set_hl(0, "GitSignsCurrentLineBlame", {
      fg = "#6e738d", -- Blue color (adjust to your preference)
      italic = true,
    })
  end,
  keys = {
    {
      "<leader>ub",
      "<cmd>Gitsigns toggle_current_line_blame<cr>",
      desc = "Toggle Git Blame",
    },
  },
}
