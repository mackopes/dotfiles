local function has_toml_table(path, table_name)
  local file = io.open(path, "r")
  if not file then
    return false
  end

  local content = file:read("*a")
  file:close()

  for line in content:gmatch("[^\r\n]+") do
    local uncommented = line:match("^[^#]*")
    if vim.trim(uncommented) == "[" .. table_name .. "]" then
      return true
    end
  end

  return false
end

local function path_exists(path)
  return vim.uv.fs_stat(path) ~= nil
end

local function pyright_root(bufnr, on_dir)
  local dir = vim.fs.dirname(vim.api.nvim_buf_get_name(bufnr))
  local workspace_root
  local project_root

  while dir do
    local pyproject = vim.fs.joinpath(dir, "pyproject.toml")

    -- An explicit Pyright configuration is an intentional analysis boundary.
    if path_exists(vim.fs.joinpath(dir, "pyrightconfig.json")) or has_toml_table(pyproject, "tool.pyright") then
      on_dir(dir)
      return
    end

    if path_exists(pyproject) then
      workspace_root = workspace_root or (has_toml_table(pyproject, "tool.uv.workspace") and dir)
      project_root = project_root or dir
    end

    for _, marker in ipairs({ "setup.py", "setup.cfg", "requirements.txt", "Pipfile" }) do
      if not project_root and path_exists(vim.fs.joinpath(dir, marker)) then
        project_root = dir
      end
    end

    -- Do not use configuration from a parent repository.
    if path_exists(vim.fs.joinpath(dir, ".git")) then
      on_dir(workspace_root or project_root or dir)
      return
    end

    local parent = vim.fs.dirname(dir)
    if parent == dir then
      break
    end
    dir = parent
  end

  on_dir(workspace_root or project_root)
end

return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        pyright = {
          root_dir = pyright_root,
        },
      },
    },
  },
}
