return {
  -- ESLint integration
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        eslint = {
          settings = {
            -- Helps eslint find the eslintrc when it's placed in a subfolder instead of the cwd root
            workingDirectories = { mode = "auto" },
            format = true,
          },
        },
      },
      setup = {
        eslint = function()
          -- Run ESLint formatting on save
          vim.api.nvim_create_autocmd("BufWritePre", {
            pattern = { "*.tsx", "*.ts", "*.jsx", "*.js" },
            command = "silent! EslintFixAll",
            group = vim.api.nvim_create_augroup("MyAutocmdsJavaScriptFormatting", {}),
          })
        end,
      },
    },
  },

  -- Ensure ESLint is installed via Mason
  {
    "mason-org/mason.nvim",
    opts = function(_, opts)
      opts.ensure_installed = opts.ensure_installed or {}
      vim.list_extend(opts.ensure_installed, { "eslint-lsp" })
    end,
  },
}
