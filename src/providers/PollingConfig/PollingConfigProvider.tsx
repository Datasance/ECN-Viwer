import React from "react";
import { useControllerConfig } from "../../contexts/ActiveContextProvider";

export const PollingConfigContext = React.createContext<{
  mainPollingInterval: number;
  slideoverPollingInterval: number;
  updatePollingConfig: (config: {
    mainPollingInterval?: number;
    slideoverPollingInterval?: number;
  }) => void;
  getPollingInterval: () => number;
  getSlideoverInterval: () => number;
}>({
  mainPollingInterval: 3000,
  slideoverPollingInterval: 5000,
  updatePollingConfig: () => {},
  getPollingInterval: () => 3000,
  getSlideoverInterval: () => 5000,
});

export const usePollingConfig = () => React.useContext(PollingConfigContext);

const STORAGE_KEY = "ecn-viewer-polling-config";

const getDefaultConfig = (controllerRefresh: number | null) => ({
  mainPollingInterval: controllerRefresh ?? 3000,
  slideoverPollingInterval: 2000,
});

const loadConfigFromStorage = (controllerRefresh: number | null) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const defaults = getDefaultConfig(controllerRefresh);
      return {
        mainPollingInterval:
          parsed.mainPollingInterval ?? defaults.mainPollingInterval,
        slideoverPollingInterval:
          parsed.slideoverPollingInterval ?? defaults.slideoverPollingInterval,
      };
    }
  } catch (e) {
    console.error("Error loading polling config from localStorage:", e);
  }
  return getDefaultConfig(controllerRefresh);
};

export const PollingConfigProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const controllerConfig = useControllerConfig();
  const controllerRefresh =
    controllerConfig?.refresh != null ? +controllerConfig.refresh : null;
  const [config, setConfig] = React.useState(() =>
    loadConfigFromStorage(controllerRefresh),
  );

  // Listen for storage changes (for cross-tab synchronization)
  React.useEffect(() => {
    const defaults = getDefaultConfig(controllerRefresh);
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newConfig = JSON.parse(e.newValue);
          setConfig({
            mainPollingInterval:
              newConfig.mainPollingInterval ?? defaults.mainPollingInterval,
            slideoverPollingInterval:
              newConfig.slideoverPollingInterval ??
              defaults.slideoverPollingInterval,
          });
        } catch (error) {
          console.error("Error parsing storage change:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [controllerRefresh]);

  const updatePollingConfig = React.useCallback(
    (newConfig: {
      mainPollingInterval?: number;
      slideoverPollingInterval?: number;
    }) => {
      const updated = {
        mainPollingInterval:
          newConfig.mainPollingInterval !== undefined
            ? newConfig.mainPollingInterval
            : config.mainPollingInterval,
        slideoverPollingInterval:
          newConfig.slideoverPollingInterval !== undefined
            ? newConfig.slideoverPollingInterval
            : config.slideoverPollingInterval,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setConfig(updated);
      } catch (e) {
        console.error("Error saving polling config to localStorage:", e);
      }
    },
    [config],
  );

  const getPollingInterval = React.useCallback(() => {
    return config.mainPollingInterval;
  }, [config.mainPollingInterval]);

  const getSlideoverInterval = React.useCallback(() => {
    return config.slideoverPollingInterval;
  }, [config.slideoverPollingInterval]);

  return (
    <PollingConfigContext.Provider
      value={{
        mainPollingInterval: config.mainPollingInterval,
        slideoverPollingInterval: config.slideoverPollingInterval,
        updatePollingConfig,
        getPollingInterval,
        getSlideoverInterval,
      }}
    >
      {children}
    </PollingConfigContext.Provider>
  );
};
