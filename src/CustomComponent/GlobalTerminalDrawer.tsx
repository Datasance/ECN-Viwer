import React, { useMemo, useCallback, useRef } from 'react';
import { useTerminal } from '../providers/Terminal/TerminalProvider';
import ResizableBottomDrawer from './ResizableBottomDrawer';
import StableTerminalTab from './StableTerminalTab';
import StableYamlTab from './StableYamlTab';

const GlobalTerminalDrawer = () => {
  const {
    sessions,
    yamlSessions,
    activeSessionId,
    isDrawerOpen,
    removeSession,
    setActiveSession,
    closeDrawer,
    updateYamlContent,
  } = useTerminal();

  const activeYamlSession = yamlSessions.find(s => s.id === activeSessionId);

  // Use refs to store stable tab components
  const terminalTabsRef = useRef(new Map());
  const yamlTabsRef = useRef(new Map());

  // Create stable callback functions
  const handleRemoveSession = useCallback((sessionId: string) => {
    removeSession(sessionId);
  }, [removeSession]);

  // Build tabs with useMemo to avoid unnecessary recreation
  const tabs = useMemo(() => {
    const allTabs: any[] = [];

    // Add terminal tabs
    sessions.forEach(session => {
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
    yamlSessions.forEach(session => {
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
          title: session.title + (session.isDirty ? ' *' : ''),
          content: yamlElement,
        });
      }
      const tab = yamlTabsRef.current.get(session.id);
      if (tab) {
        allTabs.push(tab);
      }
    });

    // Clean up removed sessions
    const currentSessionIds = new Set([...sessions.map(s => s.id), ...yamlSessions.map(s => s.id)]);
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

    return allTabs;
  }, [sessions, yamlSessions, handleRemoveSession, updateYamlContent]);

  const handleTabChange = (tabId: string) => {
    setActiveSession(tabId);
  };

  const handleTabClose = useCallback((tabId: string) => {
    removeSession(tabId);
  }, [removeSession]);

  const handleClose = () => {
    closeDrawer();
  };

  const handleSave = async () => {
    if (activeYamlSession) {
      try {
        await activeYamlSession.onSave(activeYamlSession.content);
        updateYamlContent(activeYamlSession.id, activeYamlSession.content, false);
      } catch (error) {
        console.error('Failed to save YAML:', error);
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
      
    }
    return null;
  }, [activeSessionId]); // Only depend on activeSessionId, not the session objects

  if (sessions.length === 0 && yamlSessions.length === 0) {
    return null;
  }

  // Determine if the active tab is a YAML tab with unsaved changes
  const isActiveTabDirty = activeYamlSession?.isDirty || false;

  return (
    <ResizableBottomDrawer
      open={isDrawerOpen}
      isEdit={isActiveTabDirty}
      onClose={handleClose}
      onSave={handleSave}
      title="Sessions"
      tabs={tabs}
      activeTabId={activeSessionId || undefined}
      onTabChange={handleTabChange}
      onTabClose={handleTabClose}
      showUnsavedChangesModal={isActiveTabDirty}
    >
      {activeSessionContent}
    </ResizableBottomDrawer>
  );
};

export default GlobalTerminalDrawer;
