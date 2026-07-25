return {
  {
    "mrcjkb/rustaceanvim",
    opts = function(_, opts)
      opts.server = opts.server or {}
      opts.server.default_settings = opts.server.default_settings or {}
      opts.server.default_settings["rust-analyzer"] = opts.server.default_settings["rust-analyzer"] or {}
      opts.server.default_settings["rust-analyzer"].check = {
        command = "clippy",
      }
    end,
  },
}
