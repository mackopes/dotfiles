import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  registerSubagentCapabilityCeiling,
  type SubagentCapabilityCeilingHandle,
} from "../npm/node_modules/pi-subagents/src/api/capability-ceiling.js";

type ModeName = "plan" | "build";
type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
type ActionValue = string | number | boolean | null;

interface ModeModelProfile {
  provider: string;
  modelId: string;
  thinkingLevel: ThinkingLevel;
}

type ModeModelProfiles = Partial<Record<ModeName, ModeModelProfile>>;

interface BashPolicy {
  allowShellSyntax: boolean;
  allow: string[][];
}

interface ActionPolicy {
  field: string;
  allow: ActionValue[];
}

interface ModePolicy {
  inheritActiveTools: boolean;
  tools: string[];
  bash: BashPolicy;
  actions: Record<string, ActionPolicy>;
  instructions: string[];
}

interface ModesConfig {
  defaultMode: ModeName;
  defaultModelProfiles?: ModeModelProfiles;
  modes: Record<ModeName, ModePolicy>;
}

interface PersistedState {
  /** Legacy single-mode field, retained for migration. */
  mode?: ModeName;
  selectedMode?: ModeName;
  activeMode?: ModeName;
  baselineTools?: string[];
  modelProfiles?: ModeModelProfiles;
}

interface ModeStamp {
  mode?: ModeName;
  submittedAt?: number;
  delivery?: "immediate" | "steer" | "followUp";
}

const CONFIG_DIR =
  process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent");
const CONFIG_PATH = join(CONFIG_DIR, "modes.json");
const STATE_TYPE = "plan-build-mode-state";
const STATUS_ID = "plan-build-mode";
const WIDGET_ID = "plan-build-mode-banner";
const STAMP_TYPE = "plan-build-mode-stamp";
const MODE_CONTEXT_TYPE = "plan-build-mode-context";
const MODE_PROMPT_START = "[PI MODE CONTROL START]";
const MODE_PROMPT_END = "[PI MODE CONTROL END]";
const MODE_MESSAGE_TAG = /(?:\n\n)?<!-- PI_MODE_MESSAGE:(plan|build):[a-z0-9_-]+ -->/gi;
const FORBIDDEN_RESTRICTED_SHELL_SYNTAX = /[\n\r;|&<>`$(){}]/;
let modeMessageSequence = 0;

function isModeName(value: unknown): value is ModeName {
  return value === "plan" || value === "build";
}

function isThinkingLevel(value: unknown): value is ThinkingLevel {
  return (
    value === "off" ||
    value === "minimal" ||
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "xhigh" ||
    value === "max"
  );
}

function isModeModelProfile(value: unknown): value is ModeModelProfile {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ModeModelProfile>;
  return (
    typeof candidate.provider === "string" &&
    candidate.provider.length > 0 &&
    typeof candidate.modelId === "string" &&
    candidate.modelId.length > 0 &&
    isThinkingLevel(candidate.thinkingLevel)
  );
}

function assertConfig(value: unknown): asserts value is ModesConfig {
  if (!value || typeof value !== "object") {
    throw new Error("configuration must be a JSON object");
  }

  const candidate = value as Partial<ModesConfig>;
  if (!isModeName(candidate.defaultMode)) {
    throw new Error('defaultMode must be "plan" or "build"');
  }

  if (
    candidate.defaultModelProfiles !== undefined &&
    (!candidate.defaultModelProfiles ||
      typeof candidate.defaultModelProfiles !== "object" ||
      Array.isArray(candidate.defaultModelProfiles))
  ) {
    throw new Error("defaultModelProfiles must be an object");
  }

  for (const modeName of ["plan", "build"] as const) {
    const defaultProfile = candidate.defaultModelProfiles?.[modeName];
    if (defaultProfile !== undefined && !isModeModelProfile(defaultProfile)) {
      throw new Error(`defaultModelProfiles.${modeName} must be a valid model profile`);
    }
  }

  if (!candidate.modes || typeof candidate.modes !== "object") {
    throw new Error("modes must be an object");
  }

  for (const modeName of ["plan", "build"] as const) {
    const mode = candidate.modes[modeName] as Partial<ModePolicy> | undefined;
    if (!mode || typeof mode !== "object") {
      throw new Error(`modes.${modeName} is required`);
    }
    if (typeof mode.inheritActiveTools !== "boolean") {
      throw new Error(`modes.${modeName}.inheritActiveTools must be boolean`);
    }
    if (!Array.isArray(mode.tools) || !mode.tools.every((tool) => typeof tool === "string")) {
      throw new Error(`modes.${modeName}.tools must be an array of tool names`);
    }
    if (!mode.bash || typeof mode.bash !== "object") {
      throw new Error(`modes.${modeName}.bash is required`);
    }
    if (typeof mode.bash.allowShellSyntax !== "boolean") {
      throw new Error(`modes.${modeName}.bash.allowShellSyntax must be boolean`);
    }
    if (
      !Array.isArray(mode.bash.allow) ||
      !mode.bash.allow.every(
        (rule) =>
          Array.isArray(rule) &&
          rule.length > 0 &&
          rule.every((part) => typeof part === "string" && part.length > 0),
      )
    ) {
      throw new Error(`modes.${modeName}.bash.allow must contain non-empty argv-prefix arrays`);
    }
    if (!mode.actions || typeof mode.actions !== "object" || Array.isArray(mode.actions)) {
      throw new Error(`modes.${modeName}.actions must be an object`);
    }
    for (const [toolName, action] of Object.entries(mode.actions)) {
      if (!action || typeof action !== "object") {
        throw new Error(`modes.${modeName}.actions.${toolName} must be an object`);
      }
      if (typeof action.field !== "string" || action.field.length === 0) {
        throw new Error(`modes.${modeName}.actions.${toolName}.field must be a dotted field path`);
      }
      if (!Array.isArray(action.allow)) {
        throw new Error(`modes.${modeName}.actions.${toolName}.allow must be an array`);
      }
    }
    if (
      !Array.isArray(mode.instructions) ||
      !mode.instructions.every((instruction) => typeof instruction === "string")
    ) {
      throw new Error(`modes.${modeName}.instructions must be an array of strings`);
    }
  }
}

async function loadConfig(): Promise<ModesConfig> {
  let text: string;
  try {
    text = await readFile(CONFIG_PATH, "utf8");
  } catch (error) {
    throw new Error(`cannot read ${CONFIG_PATH}: ${String(error)}`);
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`invalid JSON in ${CONFIG_PATH}: ${String(error)}`);
  }

  assertConfig(value);
  return value;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function createModeMessageTag(mode: ModeName): string {
  modeMessageSequence += 1;
  return `<!-- PI_MODE_MESSAGE:${mode}:${Date.now().toString(36)}-${modeMessageSequence.toString(36)} -->`;
}

function extractModeMessageTag(text: string): ModeName | undefined {
  let found: ModeName | undefined;
  for (const match of text.matchAll(MODE_MESSAGE_TAG)) {
    if (isModeName(match[1])) found = match[1];
  }
  return found;
}

function stripModeMessageTags(text: string): string {
  return text.replace(MODE_MESSAGE_TAG, "").trimEnd();
}

function messageText(message: { content?: unknown }): string {
  if (typeof message.content === "string") return message.content;
  if (!Array.isArray(message.content)) return "";
  return message.content
    .filter(
      (part): part is { type: "text"; text: string } =>
        !!part &&
        typeof part === "object" &&
        (part as { type?: unknown }).type === "text" &&
        typeof (part as { text?: unknown }).text === "string",
    )
    .map((part) => part.text)
    .join("\n");
}

function stripModeTagFromMessage<T>(message: T): T {
  const candidate = message as T & { content?: unknown };
  if (typeof candidate.content === "string") {
    return {
      ...candidate,
      content: stripModeMessageTags(candidate.content),
    } as T;
  }
  if (!Array.isArray(candidate.content)) return message;
  return {
    ...candidate,
    content: candidate.content.map((part) => {
      if (
        part &&
        typeof part === "object" &&
        (part as { type?: unknown }).type === "text" &&
        typeof (part as { text?: unknown }).text === "string"
      ) {
        return {
          ...part,
          text: stripModeMessageTags((part as { text: string }).text),
        };
      }
      return part;
    }),
  } as T;
}

function shellWords(command: string): string[] | undefined {
  const words: string[] = [];
  let word = "";
  let quote: "'" | '"' | undefined;
  let escaping = false;
  let started = false;

  for (const character of command) {
    if (escaping) {
      word += character;
      escaping = false;
      started = true;
      continue;
    }

    if (character === "\\" && quote !== "'") {
      escaping = true;
      started = true;
      continue;
    }

    if (quote) {
      if (character === quote) quote = undefined;
      else word += character;
      started = true;
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
      started = true;
      continue;
    }

    if (/\s/.test(character)) {
      if (started) {
        words.push(word);
        word = "";
        started = false;
      }
      continue;
    }

    word += character;
    started = true;
  }

  if (escaping || quote) return undefined;
  if (started) words.push(word);
  return words;
}

function hasUnsafeReadCommandOptions(argv: string[]): boolean {
  const [program, ...args] = argv;

  if (program === "rg" && args.some((arg) => arg === "--pre" || arg.startsWith("--pre="))) {
    return true;
  }

  if (
    program === "git" &&
    args.some(
      (arg) =>
        arg === "--ext-diff" ||
        arg === "--textconv" ||
        arg === "--output" ||
        arg.startsWith("--output="),
    )
  ) {
    return true;
  }

  return false;
}

function isAllowedBash(command: string, policy: BashPolicy): boolean {
  if (policy.allow.some((rule) => rule.length === 1 && rule[0] === "*")) {
    return true;
  }

  if (!policy.allowShellSyntax && FORBIDDEN_RESTRICTED_SHELL_SYNTAX.test(command)) {
    return false;
  }

  const argv = shellWords(command.trim());
  if (!argv || argv.length === 0 || hasUnsafeReadCommandOptions(argv)) {
    return false;
  }

  return policy.allow.some(
    (rule) =>
      rule.length <= argv.length &&
      rule.every((expected, index) => argv[index] === expected),
  );
}

function getField(input: unknown, path: string): unknown {
  let current = input;
  for (const segment of path.split(".")) {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export default async function planBuildModeExtension(pi: ExtensionAPI): Promise<void> {
  const config = await loadConfig();
  let selectedMode: ModeName = config.defaultMode;
  let activeMode: ModeName = config.defaultMode;
  let baselineTools: string[] = [];
  let modelProfiles: ModeModelProfiles = {};
  let allowedTools = new Set<string>();
  let subagentCeiling: SubagentCapabilityCeilingHandle | undefined;
  let subagentCeilingSessionId: string | undefined;
  let sessionStarted = false;
  let agentRunning = false;
  let modeTransition: Promise<void> = Promise.resolve();
  let modeWidgetMounted = false;
  let refreshModeWidget: (() => void) | undefined;

  function policy(modeName: ModeName = activeMode): ModePolicy {
    return config.modes[modeName];
  }

  function syncSubagentCeiling(ctx: ExtensionContext): void {
    if (activeMode === "plan") {
      const ceiling = {
        allowedAgents: ["explore"],
        allowedTools: ["read", "grep", "find", "ls"],
        denyExtensions: true,
      } as const;
      const sessionId = ctx.sessionManager.getSessionId();

      if (subagentCeiling && subagentCeilingSessionId !== sessionId) {
        subagentCeiling.dispose();
        subagentCeiling = undefined;
        subagentCeilingSessionId = undefined;
      }

      if (subagentCeiling) subagentCeiling.update(ceiling);
      else {
        subagentCeiling = registerSubagentCapabilityCeiling({
          sessionId,
          source: "plan-build-mode:plan",
          ceiling,
        });
        subagentCeilingSessionId = sessionId;
      }
      return;
    }

    subagentCeiling?.dispose();
    subagentCeiling = undefined;
    subagentCeilingSessionId = undefined;
  }

  function configuredRuntimeTools(): string[] {
    const available = new Set(pi.getAllTools().map((tool) => tool.name));
    const selected = [...baselineTools];
    for (const modeName of ["plan", "build"] as const) {
      selected.push(...config.modes[modeName].tools);
    }
    return unique(selected).filter((tool) => available.has(tool));
  }

  function configuredAllowedTools(modeName: ModeName): string[] {
    const current = policy(modeName);
    return unique([
      ...(current.inheritActiveTools ? baselineTools : []),
      ...current.tools,
    ]);
  }

  function persistState(): void {
    pi.appendEntry(STATE_TYPE, {
      selectedMode,
      activeMode,
      baselineTools,
      modelProfiles: {
        plan: modelProfiles.plan ? { ...modelProfiles.plan } : undefined,
        build: modelProfiles.build ? { ...modelProfiles.build } : undefined,
      },
    });
  }

  function rememberCurrentModelProfile(targetMode: ModeName, ctx: ExtensionContext): void {
    if (!ctx.model) return;
    modelProfiles[targetMode] = {
      provider: ctx.model.provider,
      modelId: ctx.model.id,
      thinkingLevel: pi.getThinkingLevel(),
    };
  }

  function rememberCurrentModelProfileUnlessPending(
    targetMode: ModeName,
    ctx: ExtensionContext,
  ): void {
    const remembered = modelProfiles[targetMode];
    if (
      remembered &&
      (remembered.provider !== ctx.model?.provider || remembered.modelId !== ctx.model.id)
    ) {
      // A different remembered model is pending restoration (for example, auth is temporarily unavailable).
      return;
    }
    rememberCurrentModelProfile(targetMode, ctx);
  }

  async function restoreModeModelProfile(
    targetMode: ModeName,
    ctx: ExtensionContext,
  ): Promise<void> {
    const remembered = modelProfiles[targetMode];
    if (!remembered) {
      rememberCurrentModelProfile(targetMode, ctx);
      return;
    }

    const isAlreadySelected =
      ctx.model?.provider === remembered.provider && ctx.model.id === remembered.modelId;

    if (!isAlreadySelected) {
      const targetModel = ctx.modelRegistry.find(remembered.provider, remembered.modelId);
      if (!targetModel) {
        ctx.ui.notify(
          `Remembered ${targetMode.toUpperCase()} model is unavailable: ${remembered.provider}/${remembered.modelId}`,
          "warning",
        );
        return;
      }

      try {
        const success = await pi.setModel(targetModel);
        if (!success) {
          ctx.ui.notify(
            `Cannot restore ${targetMode.toUpperCase()} model without authentication: ${remembered.provider}/${remembered.modelId}`,
            "warning",
          );
          return;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(
          `Could not restore ${targetMode.toUpperCase()} model: ${message}`,
          "warning",
        );
        return;
      }
    }

    pi.setThinkingLevel(remembered.thinkingLevel);
    modelProfiles[targetMode] = {
      provider: remembered.provider,
      modelId: remembered.modelId,
      thinkingLevel: pi.getThinkingLevel(),
    };
  }

  function modeDescription(modeName: ModeName): string {
    return modeName === "plan" ? "PLAN · local read only · Linear/Better Stack MCP" : "BUILD · write enabled";
  }

  function ensureModeWidget(ctx: ExtensionContext): void {
    if (!ctx.hasUI || modeWidgetMounted) return;

    ctx.ui.setWidget(
      WIDGET_ID,
      (tui, theme) => {
        refreshModeWidget = () => tui.requestRender();
        return {
          render: () => {
            const selectedIsPlan = selectedMode === "plan";
            const banner = agentRunning
              ? `◆  RUNNING ${activeMode.toUpperCase()}  ·  NEXT ${selectedMode.toUpperCase()}`
              : `◆  NEXT MESSAGE: ${selectedMode.toUpperCase()}  ·  ${selectedIsPlan ? "LOCAL READ ONLY · MCP ENABLED" : "WRITES ENABLED"}`;
            return [
              theme.fg(
                selectedIsPlan ? "warning" : "border",
                theme.bold(banner),
              ),
            ];
          },
          invalidate: () => {},
          dispose: () => {
            refreshModeWidget = undefined;
            modeWidgetMounted = false;
          },
        };
      },
      { placement: "belowEditor" },
    );
    modeWidgetMounted = true;
  }

  function updateStatus(ctx: ExtensionContext): void {
    if (!ctx.hasUI) return;

    const text = agentRunning
      ? activeMode === selectedMode
        ? `RUNNING ${modeDescription(activeMode)}`
        : `RUNNING ${activeMode.toUpperCase()} · NEXT ${selectedMode.toUpperCase()}`
      : `NEXT ${modeDescription(selectedMode)}`;
    ctx.ui.setStatus(
      STATUS_ID,
      ctx.ui.theme.fg(selectedMode === "plan" ? "warning" : "border", text),
    );
    ensureModeWidget(ctx);
    refreshModeWidget?.();
  }

  function initializeRuntimeTools(): void {
    pi.setActiveTools(configuredRuntimeTools());
  }

  function applyActiveMode(ctx: ExtensionContext, persist = true): void {
    allowedTools = new Set(configuredAllowedTools(activeMode));
    syncSubagentCeiling(ctx);
    updateStatus(ctx);
    if (persist) persistState();
  }

  function enqueueModeTransition(operation: () => Promise<void>): Promise<void> {
    const result = modeTransition.then(operation, operation);
    modeTransition = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async function activateMode(
    nextMode: ModeName,
    ctx: ExtensionContext,
    restoreProfile: boolean,
  ): Promise<void> {
    if (activeMode !== nextMode) {
      rememberCurrentModelProfileUnlessPending(activeMode, ctx);
      activeMode = nextMode;
    }
    applyActiveMode(ctx, false);
    if (restoreProfile) await restoreModeModelProfile(activeMode, ctx);
    persistState();
  }

  async function setModeNow(nextMode: ModeName, ctx: ExtensionContext): Promise<void> {
    if (selectedMode === nextMode) {
      updateStatus(ctx);
      ctx.ui.notify(`Next message is already ${selectedMode.toUpperCase()}`, "info");
      return;
    }

    selectedMode = nextMode;
    updateStatus(ctx);
    persistState();
    ctx.ui.notify(
      `Next message will use ${selectedMode.toUpperCase()} mode; the running message is unchanged`,
      "info",
    );
  }

  function setMode(nextMode: ModeName, ctx: ExtensionContext): Promise<void> {
    return enqueueModeTransition(() => setModeNow(nextMode, ctx));
  }

  function toggleMode(ctx: ExtensionContext): Promise<void> {
    return setMode(selectedMode === "plan" ? "build" : "plan", ctx);
  }

  pi.registerEntryRenderer(STAMP_TYPE, (entry, _options, theme) => {
    const data = entry.data as ModeStamp | undefined;
    if (!isModeName(data?.mode)) {
      return new Text(theme.fg("dim", "◆  UNKNOWN MODE"), 1, 0);
    }

    const isPlan = data.mode === "plan";
    const stamp = isPlan
      ? "◆  PLAN MODE  ·  LOCAL READ-ONLY · LINEAR/BETTER STACK MCP ENABLED"
      : "◆  BUILD MODE  ·  WRITES WERE ENABLED";
    return new Text(
      theme.fg(isPlan ? "warning" : "border", theme.bold(stamp)),
      1,
      0,
    );
  });

  pi.on("input", async (event) => {
    if (event.source === "extension") return { action: "continue" };

    const delivery = event.streamingBehavior ?? "immediate";
    pi.appendEntry(STAMP_TYPE, {
      mode: selectedMode,
      submittedAt: Date.now(),
      delivery,
    });

    return {
      action: "transform",
      text: `${event.text}\n\n${createModeMessageTag(selectedMode)}`,
      images: event.images,
    };
  });

  pi.registerCommand("mode", {
    description: "Show or set the next-message mode: /mode, /mode plan, /mode build",
    handler: async (args, ctx) => {
      const requested = args.trim().toLowerCase();
      if (requested === "") {
        const running = agentRunning ? `Running: ${activeMode.toUpperCase()}. ` : "";
        ctx.ui.notify(`${running}Next message: ${selectedMode.toUpperCase()}`, "info");
        return;
      }
      if (!isModeName(requested)) {
        ctx.ui.notify('Usage: /mode [plan|build]', "warning");
        return;
      }
      await setMode(requested, ctx);
    },
  });

  pi.registerCommand("plan", {
    description: "Set the next message to locally read-only plan mode",
    handler: async (_args, ctx) => await setMode("plan", ctx),
  });

  pi.registerCommand("build", {
    description: "Set the next message to build mode",
    handler: async (_args, ctx) => await setMode("build", ctx),
  });

  pi.registerShortcut("tab", {
    description: "Toggle the next message between PLAN/BUILD",
    handler: async (ctx) => await toggleMode(ctx),
  });

  pi.on("model_select", async (event, ctx) => {
    if (!sessionStarted) return;
    const profileMode = ctx.isIdle() ? selectedMode : activeMode;
    modelProfiles[profileMode] = {
      provider: event.model.provider,
      modelId: event.model.id,
      thinkingLevel: pi.getThinkingLevel(),
    };
    persistState();
  });

  pi.on("thinking_level_select", async (event, ctx) => {
    if (!sessionStarted || !ctx.model) return;
    const profileMode = ctx.isIdle() ? selectedMode : activeMode;
    modelProfiles[profileMode] = {
      provider: ctx.model.provider,
      modelId: ctx.model.id,
      thinkingLevel: event.level,
    };
    persistState();
  });

  pi.on("session_start", async (_event, ctx) => {
    sessionStarted = false;
    agentRunning = !ctx.isIdle();
    const entries = ctx.sessionManager.getBranch();
    const saved = entries
      .filter(
        (entry) => entry.type === "custom" && entry.customType === STATE_TYPE,
      )
      .at(-1) as { data?: PersistedState } | undefined;

    baselineTools =
      saved?.data?.baselineTools?.filter((tool) => typeof tool === "string") ??
      pi.getActiveTools();

    const legacyMode = isModeName(saved?.data?.mode) ? saved.data.mode : undefined;
    selectedMode = isModeName(saved?.data?.selectedMode)
      ? saved.data.selectedMode
      : legacyMode ?? config.defaultMode;
    activeMode = isModeName(saved?.data?.activeMode)
      ? saved.data.activeMode
      : legacyMode ?? selectedMode;

    modelProfiles = {};
    for (const modeName of ["plan", "build"] as const) {
      const savedProfile = saved?.data?.modelProfiles?.[modeName];
      const defaultProfile = config.defaultModelProfiles?.[modeName];
      const profile = isModeModelProfile(savedProfile) ? savedProfile : defaultProfile;
      if (isModeModelProfile(profile)) {
        modelProfiles[modeName] = { ...profile };
      }
    }

    if (!modelProfiles[selectedMode]) {
      rememberCurrentModelProfile(selectedMode, ctx);
    }

    sessionStarted = true;
    initializeRuntimeTools();
    applyActiveMode(ctx, false);
    persistState();
  });

  pi.on("before_agent_start", async (event, ctx) => {
    const submittedMode = extractModeMessageTag(event.prompt) ?? selectedMode;
    await activateMode(submittedMode, ctx, true);

    let basePrompt = event.systemPrompt.replace(
      /\n\n\[PI MODE CONTROL START\][\s\S]*?\[PI MODE CONTROL END\]/g,
      "",
    );

    // Remove the unmarked suffix used by earlier versions of this extension.
    for (const modeName of ["plan", "build"] as const) {
      const oldSuffix = `\n\n[ACTIVE MODE: ${modeName.toUpperCase()}]\n${config.modes[modeName].instructions.join("\n")}`;
      basePrompt = basePrompt.replaceAll(oldSuffix, "");
    }

    return {
      systemPrompt: `${basePrompt}\n\n${MODE_PROMPT_START}\nMode is scoped to each submitted user message. The latest hidden ${MODE_CONTEXT_TYPE} context message is authoritative for the current turn. Do not infer the active mode from older conversation turns.\n${MODE_PROMPT_END}`,
    };
  });

  pi.on("message_start", async (event, ctx) => {
    if (event.message.role !== "user") return;
    const submittedMode = extractModeMessageTag(messageText(event.message));
    if (submittedMode) await activateMode(submittedMode, ctx, false);
  });

  pi.on("message_end", async (event) => {
    if (event.message.role !== "user") return;
    if (!extractModeMessageTag(messageText(event.message))) return;
    return { message: stripModeTagFromMessage(event.message) };
  });

  pi.on("context", async (event) => {
    const messages = event.messages
      .filter(
        (message) =>
          !(
            message.role === "custom" &&
            (message as { customType?: string }).customType === MODE_CONTEXT_TYPE
          ),
      )
      .map((message) => stripModeTagFromMessage(message));
    const instructions = policy(activeMode).instructions.join("\n");

    messages.push({
      role: "custom",
      customType: MODE_CONTEXT_TYPE,
      content: `${MODE_PROMPT_START}\n[ACTIVE MODE: ${activeMode.toUpperCase()}]\n${instructions}\nThe runtime may expose tools needed by other queued modes; only use tools permitted by the active mode above.\n${MODE_PROMPT_END}`,
      display: false,
      timestamp: Date.now(),
    });

    return { messages };
  });

  pi.on("agent_start", async (_event, ctx) => {
    agentRunning = true;
    updateStatus(ctx);
  });

  pi.on("agent_settled", async (_event, ctx) => {
    agentRunning = false;
    updateStatus(ctx);
  });

  pi.on("tool_call", async (event) => {
    const current = policy(activeMode);
    const dynamicallyInherited =
      current.inheritActiveTools && pi.getActiveTools().includes(event.toolName);

    if (!allowedTools.has(event.toolName) && !dynamicallyInherited) {
      return {
        block: true,
        reason: `${event.toolName} is not permitted in ${activeMode.toUpperCase()} mode`,
      };
    }

    if (event.toolName === "bash") {
      const command = String(
        (event.input as { command?: unknown } | undefined)?.command ?? "",
      );
      if (!isAllowedBash(command, current.bash)) {
        return {
          block: true,
          reason: `${activeMode.toUpperCase()} mode blocked this Bash command: ${command}`,
        };
      }
    }

    const actionPolicy = current.actions[event.toolName];
    if (actionPolicy) {
      const rawValue = getField(event.input, actionPolicy.field);
      const value = rawValue === undefined ? null : rawValue;
      if (!actionPolicy.allow.some((allowed) => Object.is(allowed, value))) {
        return {
          block: true,
          reason: `${activeMode.toUpperCase()} mode does not permit ${event.toolName}.${actionPolicy.field}=${String(value)}`,
        };
      }
    }
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    sessionStarted = false;
    agentRunning = false;
    subagentCeiling?.dispose();
    subagentCeiling = undefined;
    subagentCeilingSessionId = undefined;
    if (ctx.hasUI) {
      ctx.ui.setStatus(STATUS_ID, undefined);
      ctx.ui.setWidget(WIDGET_ID, undefined);
    }
    refreshModeWidget = undefined;
    modeWidgetMounted = false;
  });
}
