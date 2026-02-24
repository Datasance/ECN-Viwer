import React, { useEffect, useState } from "react";
import { useActiveContext } from "./ActiveContextProvider";
import type { EcnViewerContext } from "./types";
import { getContextStore, SESSION_KEY_CONTEXT_CHOSEN } from "./contextStore";
import { generateContextId } from "./types";
import { validateContextData } from "./contextSchema";
import { yamlToContext, contextToYaml, yamlToContexts, contextsToYaml } from "./yamlHandlers";

type ContextsPageProps = {
  /** When switching to a different context while one is active, call before redirect (e.g. sign out). */
  onSignOutBeforeSwitch?: () => Promise<void>;
};

export default function ContextsPage({ onSignOutBeforeSwitch }: ContextsPageProps = {}) {
  const { contexts, activeContext, setActiveContextId, refreshContexts, implicitContext } = useActiveContext();
  const [yamlText, setYamlText] = useState("");
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    refreshContexts();
  }, [refreshContexts]);

  const handleConnect = async (ctx: EcnViewerContext) => {
    if (ctx.id === "legacy") {
      const store = getContextStore();
      await store.saveContext(ctx);
    }
    sessionStorage.setItem(SESSION_KEY_CONTEXT_CHOSEN, "1");
    await setActiveContextId(ctx.id);
    if (activeContext && ctx.id !== activeContext.id && onSignOutBeforeSwitch) {
      window.location.hash = "#/dashboard";
      await onSignOutBeforeSwitch();
    } else {
      window.location.hash = "#/dashboard";
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this context?")) return;
    const store = getContextStore();
    await store.deleteContext(id);
    await refreshContexts();
  };

  const handleImportYaml = () => {
    const { contexts: parsed, errors } = yamlToContexts(yamlText);
    setYamlError(errors.length ? errors.join("\n") : null);
    if (parsed.length === 0) return;
    (async () => {
      const store = getContextStore();
      for (const ctx of parsed) {
        if (!ctx.id) ctx.id = generateContextId();
        await store.saveContext(ctx);
      }
      setYamlText("");
      setYamlError(null);
      await refreshContexts();
    })();
  };

  const handleExportYaml = () => {
    if (contexts.length === 0) return;
    const yaml = contextsToYaml(contexts);
    const blob = new Blob([yaml], { type: "application/x-yaml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ecn-viewer-contexts.yaml";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleSaveNewFromYaml = () => {
    const { context, error } = yamlToContext(yamlText);
    setYamlError(error);
    if (!context) return;
    (async () => {
      const store = getContextStore();
      await store.saveContext(context);
      setYamlText("");
      setYamlError(null);
      setEditingId(null);
      await refreshContexts();
    })();
  };

  const startEdit = (ctx: EcnViewerContext) => {
    setEditingId(ctx.id);
    setYamlText(contextToYaml(ctx));
    setYamlError(null);
  };

  const handleUpdateFromYaml = () => {
    const { context, error } = yamlToContext(yamlText);
    setYamlError(error);
    if (!context || !editingId) return;
    (async () => {
      const store = getContextStore();
      await store.saveContext({ ...context, id: editingId });
      setYamlText("");
      setYamlError(null);
      setEditingId(null);
      await refreshContexts();
    })();
  };

  const testConnection = async (ctx: EcnViewerContext) => {
    setTestingId(ctx.id);
    try {
      const url = `${ctx.controllerUrl.replace(/\/$/, "")}/api/v3/status`;
      let res: Response;
      if (
        ctx.controllerCA &&
        typeof (window as unknown as { __controllerFetch?: (opts: unknown) => Promise<{ ok: boolean; status: number; statusText: string; body: string }> }).__controllerFetch === "function"
      ) {
        const w = window as unknown as { __controllerFetch: (opts: { url: string; controllerCA: string }) => Promise<{ ok: boolean; status: number; statusText: string; body: string }> };
        const result = await w.__controllerFetch({ url, controllerCA: ctx.controllerCA });
        res = new Response(result.body, { status: result.status, statusText: result.statusText });
      } else {
        res = await fetch(url);
      }
      if (res.ok) {
        const data = await res.json();
        alert(`Connected. Controller: ${data?.versions?.controller ?? "unknown"}`);
      } else {
        alert(`Connection failed: ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      alert(`Connection failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Contexts</h1>
            <p className="text-gray-400">
              Add or select a controller connection to manage your Datasance PoT / ioFog cluster.
            </p>
          </div>
          {activeContext && (
            <button
              type="button"
              onClick={async () => {
                await setActiveContextId(null);
                window.location.reload();
              }}
              className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* List */}
        <div className="space-y-3 mb-8">
          {contexts.length === 0 && !implicitContext && !editingId && (
            <div className="rounded-lg border border-gray-700 p-4 text-gray-400">
              No contexts yet. Add one using the YAML editor below or import from file.
            </div>
          )}
          {(() => {
            const hasLegacy = contexts.some((c) => c.id === "legacy");
            const displayList =
              implicitContext && !hasLegacy
                ? [implicitContext, ...contexts]
                : contexts;
            return displayList.map((ctx) => (
            <div
              key={ctx.id}
              className="rounded-lg border border-gray-700 p-4 flex items-center justify-between gap-4"
            >
              <div>
                <div className="font-medium flex items-center gap-2">
                  {ctx.name}
                  {ctx.id === "legacy" && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                      Default from controller-config
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400">{ctx.controllerUrl}</div>
                {ctx.keycloakUrl && (
                  <div className="text-xs text-gray-500">Keycloak: {ctx.keycloakRealm}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => testConnection(ctx)}
                  disabled={!!testingId}
                  className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-sm"
                >
                  {testingId === ctx.id ? "Testing…" : "Test"}
                </button>
                {ctx.id !== "legacy" && (
                  <button
                    type="button"
                    onClick={() => startEdit(ctx)}
                    className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-sm"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleConnect(ctx)}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-sm"
                >
                  Connect
                </button>
                {ctx.id !== "legacy" && (
                  <button
                    type="button"
                    onClick={() => handleDelete(ctx.id)}
                    className="px-3 py-1.5 rounded bg-red-900/50 hover:bg-red-800/50 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ));
          })()}
        </div>

        {/* YAML editor */}
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">
            {editingId ? "Edit context (YAML)" : "Add context (YAML)"}
          </h2>
          <textarea
            className="w-full h-48 rounded-lg bg-gray-800 border border-gray-700 p-3 font-mono text-sm"
            placeholder={`name: My Controller\ncontrollerUrl: https://pot.example.com\nkeycloakUrl: https://auth.example.com/\nkeycloakRealm: myrealm\nkeycloakClientId: ecn-viewer`}
            value={yamlText}
            onChange={(e) => {
              setYamlText(e.target.value);
              setYamlError(null);
            }}
            spellCheck={false}
          />
          {yamlError && (
            <div className="mt-2 text-sm text-red-400">{yamlError}</div>
          )}
          <div className="mt-2 flex gap-2">
            {editingId ? (
              <button
                type="button"
                onClick={handleUpdateFromYaml}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500"
              >
                Update context
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveNewFromYaml}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500"
              >
                Add context
              </button>
            )}
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setYamlText("");
                  setYamlError(null);
                }}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Import / Export */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleImportYaml}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            Import from YAML above
          </button>
          <button
            type="button"
            onClick={handleExportYaml}
            disabled={contexts.length === 0}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
          >
            Export all to YAML
          </button>
        </div>
      </div>
    </div>
  );
}
