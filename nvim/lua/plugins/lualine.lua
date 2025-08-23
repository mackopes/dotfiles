return {
  "nvim-lualine/lualine.nvim",
  event = "VeryLazy",
  opts = function(_, opts)
    -- Override the filename component in lualine_c to show more of the path
    opts.sections.lualine_c[4] = {
      "filename",
      path = 1, -- 1 = relative path
      shorting_target = 140, -- Truncate at 140 characters
      symbols = {
        modified = "[+]",
        readonly = "[-]",
        unnamed = "[No Name]",
        newfile = "[New]",
      },
    }
    return opts
  end,
}