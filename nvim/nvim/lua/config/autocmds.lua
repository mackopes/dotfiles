-- Autocmds are automatically loaded on the VeryLazy event
-- Default autocmds that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua
--
-- Add any additional autocmds here
-- with `vim.api.nvim_create_autocmd`
--
-- Or remove existing autocmds by their group name (which is prefixed with `lazyvim_` for the defaults)
-- e.g. vim.api.nvim_del_augroup_by_name("lazyvim_wrap_spell")
--
-- Customize flash.nvim colors for better visibility
vim.api.nvim_create_autocmd("ColorScheme", {
  callback = function()
    -- Label colors (the letters you press to jump)
    vim.api.nvim_set_hl(0, "FlashLabel", {
      bg = "#ff0000", -- Red background
      fg = "#ffffff", -- White text
      bold = true,
    })

    -- Current match highlight
    vim.api.nvim_set_hl(0, "FlashCurrent", {
      bg = "#00ff00", -- Green background
      fg = "#000000", -- Black text
    })

    -- Other matches
    vim.api.nvim_set_hl(0, "FlashMatch", {
      bg = "#ffff00", -- Yellow background
      fg = "#000000", -- Black text
    })

    -- Backdrop (dimmed areas)
    vim.api.nvim_set_hl(0, "FlashBackdrop", {
      fg = "#888888", -- Gray out non-matches
    })
  end,
})
