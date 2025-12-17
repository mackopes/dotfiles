return {
  "saghen/blink.cmp",
  dependencies = {
    {},
  },
  opts = {
    sources = {
      -- default = { "lsp", "path", "snippets", "buffer", "copilot" },
      default = { "lsp", "path", "snippets", "buffer" },
      -- providers = {
      --   copilot = {
      --     name = "copilot",
      --     module = "blink-cmp-copilot",
      --     score_offset = 100,
      --     async = true,
      --   },
      -- },
    },
  },
}
