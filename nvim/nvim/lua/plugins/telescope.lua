return {
  "nvim-telescope/telescope.nvim",
  opts = {
    defaults = {
      path_display = { "truncate" },
      file_ignore_patterns = {
        -- Remove ".env" from this list if it's here
        "node_modules",
        ".git/",
      }, -- Increase the width of the results window
      layout_config = {
        horizontal = {
          preview_width = 0.5,
          results_width = 0.8,
        },
        vertical = {
          preview_height = 0.5,
        },
        width = 0.9,
        height = 0.9,
      },
      -- Alternative: use "smart" to show more path when needed
      -- path_display = { "smart" },
    },
    pickers = {
      find_files = {
        -- Show more of the path for find_files specifically
        path_display = { "smart" },
      },
    },
  },
}

