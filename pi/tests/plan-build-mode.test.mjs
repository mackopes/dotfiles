// Run with: node --experimental-vm-modules --test pi/tests/plan-build-mode.test.mjs
// Exercise the real extension handlers with a mocked Pi host; no remote writes.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import * as os from "node:os";
import * as path from "node:path";
import test from "node:test";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

const source = stripTypeScriptTypes(await readFile(
  new URL("../agent/extensions/plan-build-mode.ts", import.meta.url), "utf8",
));
const config = JSON.parse(await readFile(new URL("../agent/modes.json", import.meta.url), "utf8"));

async function harness(customConfig = config, savedBaseline) {
  const handlers = new Map();
  const tools = [
    ...["read", "write", "edit", "bash", "codemode", "subagent", "fffind"].map(
      (name) => ({ name, exposure: "direct" }),
    ),
    { name: "mcp__linear__list_projects", exposure: "codemode" },
    { name: "mcp__linear__save_issue", exposure: "codemode" },
    { name: "mcp__linear__delete_status_update", exposure: "codemode" },
    { name: "mcp__betterstack__query", exposure: "deferred" },
  ];
  let active = tools.filter((tool) => tool.exposure === "direct").map((tool) => tool.name);
  const pi = {
    on: (name, handler) => handlers.set(name, handler),
    registerCommand() {}, registerShortcut() {}, registerEntryRenderer() {}, appendEntry() {},
    getAllTools: () => tools,
    getActiveTools: () => active,
    setActiveTools: (names) => { active = names; },
    getThinkingLevel: () => "high",
    setThinkingLevel() {},
  };
  const ctx = {
    hasUI: false,
    isIdle: () => true,
    modelRegistry: { find: () => undefined },
    ui: { notify() {} },
    sessionManager: {
      getSessionId: () => "permission-test",
      getBranch: () => savedBaseline ? [{
        type: "custom", customType: "plan-build-mode-state",
        data: { baselineTools: savedBaseline },
      }] : [],
    },
  };
  const context = createContext({ process });
  const module = new SourceTextModule(source, { context });
  const imports = {
    "node:fs/promises": { readFile: async () => JSON.stringify(customConfig) },
    "node:os": os,
    "node:path": path,
    "@earendil-works/pi-tui": { Text: class {} },
    "../npm/node_modules/pi-subagents/src/api/capability-ceiling.js": {
      registerSubagentCapabilityCeiling: () => ({ update() {}, dispose() {} }),
    },
  };
  await module.link((specifier) => {
    const exports = imports[specifier];
    assert.ok(exports, `unexpected import: ${specifier}`);
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context });
  });
  await module.evaluate();
  await module.namespace.default(pi);
  await handlers.get("session_start")({}, ctx);
  return {
    tools,
    active: () => active,
    activate: (mode) => handlers.get("before_agent_start")({
      prompt: `test <!-- PI_MODE_MESSAGE:${mode}:test -->`, systemPrompt: "test",
    }, ctx),
    call: (toolName, input = {}, nested = false) => handlers.get("tool_call")({
      toolName, input, ...(nested ? { parentToolCallId: "codemode-test" } : {}),
    }, ctx),
  };
}

async function allowed(host, tool, input = {}, nested = false) {
  assert.equal(await host.call(tool, input, nested), undefined, `${tool} should be allowed`);
}
async function blocked(host, tool, input = {}, nested = false) {
  assert.equal((await host.call(tool, input, nested))?.block, true, `${tool} should be blocked`);
}

test("Plan allows Codemode while retaining nested local/action restrictions", async () => {
  const host = await harness();
  await host.activate("plan");
  await allowed(host, "codemode");
  for (const nested of [false, true]) {
    await allowed(host, "read", { path: "example" }, nested);
    await allowed(host, "bash", { command: "git status --short" }, nested);
    await allowed(host, "subagent", { action: "list" }, nested);
    await blocked(host, "write", { path: "example", content: "bad" }, nested);
    await blocked(host, "edit", {}, nested);
    await blocked(host, "bash", { command: "touch example" }, nested);
    await blocked(host, "bash", { command: "ls; touch example" }, nested);
    await blocked(host, "bash", { command: "git diff --output=example" }, nested);
    await blocked(host, "subagent", { action: "run" }, nested);
  }
});

test("Linear reads and writes and Better Stack work in both modes, even after resume", async () => {
  const host = await harness(config, ["read"]);
  for (const mode of ["plan", "build", "plan"]) {
    await host.activate(mode);
    await allowed(host, "codemode");
    for (const name of [
      "mcp__linear__list_projects", "mcp__linear__save_issue",
      "mcp__linear__delete_status_update", "mcp__betterstack__query",
    ]) {
      await allowed(host, name);
      await allowed(host, name, {}, true);
      assert.ok(!host.active().includes(name), "namespace grants must not declare every MCP tool");
    }
  }
});

test("Plan namespace matching does not grant similarly named servers or arbitrary tools", async () => {
  const host = await harness();
  await host.activate("plan");
  for (const name of ["mcp__linear_other__save_issue", "mcp__linearX__save_issue", "mcp__other__read", "read_more"]) {
    host.tools.push({ name, exposure: "codemode" });
    await blocked(host, name, {}, true);
  }
});

test("Build inherits late callable tools but not inactive direct or hidden tools", async () => {
  const host = await harness();
  await host.activate("build");
  for (const exposure of ["codemode", "deferred", "direct", "hidden"]) {
    const name = `late_${exposure}`;
    host.tools.push({ name, exposure });
    if (exposure === "codemode" || exposure === "deferred") await allowed(host, name, {}, true);
    else await blocked(host, name, {}, true);
  }
  await allowed(host, "write");
  await allowed(host, "edit");
  await allowed(host, "bash", { command: "echo example > example" }, true);
  await allowed(host, "subagent", { action: "run" }, true);
  await host.activate("plan");
  await blocked(host, "late_codemode", {}, true);
  await blocked(host, "write", {}, true);
});

test("Build always includes complete Plan calls, including Bash and action permissions", async () => {
  const restrictive = structuredClone(config);
  restrictive.modes.plan.tools.push("plan_only_tool");
  restrictive.modes.build.inheritActiveTools = false;
  restrictive.modes.build.tools = ["bash", "subagent"];
  restrictive.modes.build.bash = { allowShellSyntax: false, allow: [] };
  restrictive.modes.build.actions = { subagent: { field: "action", allow: [] } };
  const host = await harness(restrictive);
  await host.activate("build");
  await allowed(host, "plan_only_tool");
  await allowed(host, "bash", { command: "git status" }, true);
  await allowed(host, "subagent", { action: "list" }, true);
  await blocked(host, "bash", { command: "touch example" }, true);
  await blocked(host, "subagent", { action: "run" }, true);
});

test("all configured Plan Bash commands and action values are also allowed in Build", async () => {
  const host = await harness();
  for (const mode of ["plan", "build"]) {
    await host.activate(mode);
    for (const argv of config.modes.plan.bash.allow) {
      await allowed(host, "bash", { command: argv.join(" ") }, true);
    }
    for (const [tool, policy] of Object.entries(config.modes.plan.actions)) {
      for (const value of policy.allow) {
        const input = {};
        let target = input;
        const fields = policy.field.split(".");
        for (const field of fields.slice(0, -1)) target = target[field] = {};
        target[fields.at(-1)] = value;
        await allowed(host, tool, input, true);
      }
    }
  }
});
