import React, { useMemo, useCallback, useRef } from "react";
import { useTerminal } from "../providers/Terminal/TerminalProvider";
import ResizableBottomDrawer from "./ResizableBottomDrawer";
import StableTerminalTab from "./StableTerminalTab";
import StableYamlTab from "./StableYamlTab";
import StableDeployTab from "./StableDeployTab";
import UnsavedChangesModal from "./UnsavedChangesModal";

const GlobalTerminalDrawer = () => {
  const {
    sessions,
    yamlSessions,
    deploySessions,
    activeSessionId,
    isDrawerOpen,
    removeSession,
    setActiveSession,
    closeDrawer,
    updateYamlContent,
    updateDeploySession,
  } = useTerminal();

  const activeYamlSession = yamlSessions.find((s) => s.id === activeSessionId);
  const activeDeploySession = deploySessions.find((s) => s.id === activeSessionId);

  // Use refs to store stable tab components
  const terminalTabsRef = useRef(new Map());
  const yamlTabsRef = useRef(new Map());
  const deployTabsRef = useRef(new Map());
  
  // State to track deploy function for header button
  const [deployFunction, setDeployFunction] = React.useState<any>(null);
  const [showDeployConfirmModal, setShowDeployConfirmModal] = React.useState(false);

  // Clear deploy function when switching away from deploy sessions
  React.useEffect(() => {
    if (!activeDeploySession) {
      setDeployFunction(null);
    }
  }, [activeDeploySession]);


  // Handle deploy confirm
  const handleDeployConfirm = useCallback(async () => {
    if (deployFunction?.deployApplication) {
      await deployFunction.deployApplication();
      setShowDeployConfirmModal(false);
      // Mark session as clean after successful deployment
      if (activeDeploySession) {
        updateDeploySession(activeDeploySession.id, false);
      }
    }
  }, [deployFunction, activeDeploySession, updateDeploySession]);

  // Create stable callback functions
  const handleRemoveSession = useCallback(
    (sessionId: string) => {
      removeSession(sessionId);
    },
    [removeSession],
  );

  // Build tabs with useMemo to avoid unnecessary recreation
  const tabs = useMemo(() => {
    const allTabs: any[] = [];

    // Add terminal tabs
    sessions.forEach((session) => {
      if (!terminalTabsRef.current.has(session.id)) {
        const terminalElement = (
          <StableTerminalTab
            sessionId={session.id}
            socketUrl={session.socketUrl}
            authToken={session.authToken}
            microserviceUuid={session.microserviceUuid}
            execId={session.execId}
            onClose={() => {
              handleRemoveSession(session.id);
            }}
          />
        );

        terminalTabsRef.current.set(session.id, {
          id: session.id,
          title: session.title,
          content: terminalElement,
        });
      } else {
      }
      const tab = terminalTabsRef.current.get(session.id);
      if (tab) {
        allTabs.push(tab);
      }
    });

    // Add YAML tabs
    yamlSessions.forEach((session) => {
      if (!yamlTabsRef.current.has(session.id)) {
        const yamlElement = (
          <StableYamlTab
            sessionId={session.id}
            content={session.content}
            onChange={(value) => updateYamlContent(session.id, value, true)}
          />
        );

        yamlTabsRef.current.set(session.id, {
          id: session.id,
          title: session.title + (session.isDirty ? " *" : ""),
          content: yamlElement,
        });
      }
      const tab = yamlTabsRef.current.get(session.id);
      if (tab) {
        allTabs.push(tab);
      }
    });

    // Add deploy tabs
    deploySessions.forEach((session) => {
      if (!deployTabsRef.current.has(session.id)) {
        const deployElement = (
          <StableDeployTab
            sessionId={session.id}
            template={session.template}
            onClose={() => {
              handleRemoveSession(session.id);
            }}
            onDirtyChange={(isDirty) => updateDeploySession(session.id, isDirty)}
            onDeployFunctionChange={(deployFunc) => {
              setDeployFunction(deployFunc);
            }}
          />
        );

        deployTabsRef.current.set(session.id, {
          id: session.id,
          title: session.title + (session.isDirty ? " *" : ""),
          content: deployElement,
        });
      }
      const tab = deployTabsRef.current.get(session.id);
      if (tab) {
        allTabs.push(tab);
      }
    });

    // Clean up removed sessions
    const currentSessionIds = new Set([
      ...sessions.map((s) => s.id),
      ...yamlSessions.map((s) => s.id),
      ...deploySessions.map((s) => s.id),
    ]);
    terminalTabsRef.current.forEach((_, sessionId) => {
      if (!currentSessionIds.has(sessionId)) {
        terminalTabsRef.current.delete(sessionId);
      }
    });
    yamlTabsRef.current.forEach((_, sessionId) => {
      if (!currentSessionIds.has(sessionId)) {
        yamlTabsRef.current.delete(sessionId);
      }
    });
    deployTabsRef.current.forEach((_, sessionId) => {
      if (!currentSessionIds.has(sessionId)) {
        deployTabsRef.current.delete(sessionId);
      }
    });

    return allTabs;
  }, [sessions, yamlSessions, deploySessions, handleRemoveSession, updateYamlContent, updateDeploySession]);

  const handleTabChange = (tabId: string) => {
    setActiveSession(tabId);
  };

  const handleTabClose = useCallback(
    (tabId: string) => {
      removeSession(tabId);
    },
    [removeSession],
  );

  const handleClose = () => {
    closeDrawer();
  };

  const handleSave = async () => {
    if (activeYamlSession) {
      try {
        await activeYamlSession.onSave(activeYamlSession.content);
        updateYamlContent(
          activeYamlSession.id,
          activeYamlSession.content,
          false,
        );
      } catch (error) {
        console.error("Failed to save YAML:", error);
      }
    } else if (activeDeploySession && deployFunction) {
      // Handle deploy action
      if (deployFunction.isValid) {
        setShowDeployConfirmModal(true);
      }
    }
  };

  // Get active session content from the stable tabs - use activeSessionId instead of objects
  const activeSessionContent = useMemo(() => {
    if (activeSessionId) {
      // Try terminal tabs first
      const terminalTab = terminalTabsRef.current.get(activeSessionId);
      if (terminalTab) {
        return terminalTab.content;
      }

      // Try YAML tabs
      const yamlTab = yamlTabsRef.current.get(activeSessionId);
      if (yamlTab) {
        return yamlTab.content;
      }

      // Try deploy tabs
      const deployTab = deployTabsRef.current.get(activeSessionId);
      if (deployTab) {
        return deployTab.content;
      }
    }
    return null;
  }, [activeSessionId]); // Only depend on activeSessionId, not the session objects

  if (sessions.length === 0 && yamlSessions.length === 0 && deploySessions.length === 0) {
    return null;
  }

  // Determine if the active tab is a YAML or deploy tab with unsaved changes
  const isActiveTabDirty = activeYamlSession?.isDirty || activeDeploySession?.isDirty || false;

  // Generate dynamic title based on active session
  const getTitle = () => {
    if (activeDeploySession) {
      return `Editing Deploy an application from ${activeDeploySession.template?.name} Template`;
    }
    if (activeYamlSession) {
      return `Editing ${activeYamlSession.title}`;
    }
    return "Sessions";
  };

  return (
    <>
      <ResizableBottomDrawer
        open={isDrawerOpen}
        isEdit={isActiveTabDirty}
        onClose={handleClose}
        onSave={handleSave}
        title={getTitle()}
        tabs={tabs}
        activeTabId={activeSessionId || undefined}
        onTabChange={handleTabChange}
        onTabClose={handleTabClose}
        showUnsavedChangesModal={isActiveTabDirty}
      >
        {activeSessionContent}
      </ResizableBottomDrawer>
      
      <UnsavedChangesModal
        open={showDeployConfirmModal}
        onCancel={() => setShowDeployConfirmModal(false)}
        onConfirm={handleDeployConfirm}
        title={`Deploy ${activeDeploySession?.template?.name}`}
        message={`Are you sure you want to deploy an Application from "${activeDeploySession?.template?.name}" Application Template? This will create a new application instance.`}
        cancelLabel="Cancel"
        confirmLabel="Deploy"
      />
    </>
  );
};

export default GlobalTerminalDrawer;
