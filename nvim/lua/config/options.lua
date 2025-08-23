-- Options are automatically loaded before lazy.nvim startup
-- Default options that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua
-- Add any additional options here

vim.g.root_spec = { "lua", "cwd" }

vim.g.snacks_debug = true

vim.g.python3_host_prog = vim.fn.system("poetry env info --path"):gsub("\n", "") .. "/bin/python"
