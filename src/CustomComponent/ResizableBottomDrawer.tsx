import React, { Fragment, useState, useRef, useEffect } from "react";
import { Transition } from "@headlessui/react";
import XMarkIcon from "@material-ui/icons/CloseOutlined";
import MinimizeIcon from "@material-ui/icons/Minimize";
import MaximizeIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CloseIcon from "@material-ui/icons/Close";
import TerminalIcon from "@material-ui/icons/Computer";
import CodeIcon from "@material-ui/icons/Description";

import UnsavedChangesModal from "./UnsavedChangesModal";

type DrawerTab = {
  id: string;
  title: string;
  content: React.ReactNode;
  onClose?: () => void;
};

type ResizableBottomDrawerProps = {
  open: boolean;
  isEdit: boolean;
  onClose: () => void;
  onSave: () => void;
  title?: string;
  children: React.ReactNode;
  showUnsavedChangesModal?: boolean;
  unsavedModalTitle?: string;
  unsavedModalMessage?: string;
  unsavedModalCancelLabel?: string;
  unsavedModalConfirmLabel?: string;
  // Tab support
  tabs?: DrawerTab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
};

const ResizableBottomDrawer = ({
  open,
  isEdit,
  onClose,
  onSave,
  title,
  children,
  showUnsavedChangesModal = true,
  unsavedModalTitle = "Changes Not Saved",
  unsavedModalMessage = "Are you sure you want to exit? All unsaved changes will be lost.",
  unsavedModalCancelLabel = "Stay",
  unsavedModalConfirmLabel = "Exit Anyway",
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
}: ResizableBottomDrawerProps) => {
  const [height, setHeight] = useState(300);
  const [lastHeight, setLastHeight] = useState(300);
  const [minimized, setMinimized] = useState(false);
  const isResizing = useRef(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const startResizing = () => {
    if (!minimized) isResizing.current = true;
  };

  const stopResizing = () => {
    isResizing.current = false;
  };

  const resize = (e: MouseEvent) => {
    if (isResizing.current) {
      const newHeight = window.innerHeight - e.clientY;
      const clamped = Math.min(
        Math.max(newHeight, 200),
        window.innerHeight - 100,
      );
      setHeight(clamped);
      setLastHeight(clamped);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, []);

  const handleCloseClick = () => {
    if (isEdit && showUnsavedChangesModal) {
      setShowConfirmModal(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmModal(false);
    onClose();
  };

  const toggleMinimize = () => {
    if (minimized) {
      setHeight(lastHeight);
      setMinimized(false);
    } else {
      setLastHeight(height);
      setHeight(40);
      setMinimized(true);
    }
  };

  return (
    <>
      <Transition show={open} as={Fragment}>
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="transform transition ease-in-out duration-200"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <div
              className="absolute bottom-0 w-full bg-gray-800 text-white rounded-t-xl shadow-xl flex flex-col pointer-events-auto"
              style={{ height }}
            >
              {!minimized && (
                <div
                  className="w-full h-3 cursor-row-resize bg-gray-700 rounded-t-xl"
                  onMouseDown={startResizing}
                />
              )}

              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                <div className="flex-1">
                  {tabs && tabs.length > 0 ? (
                    <div className="flex items-center space-x-1">
                      {tabs.map((tab) => (
                        <div
                          key={tab.id}
                          className={`flex items-center px-4 py-2 rounded-t-md cursor-pointer transition-colors min-w-0 ${
                            activeTabId === tab.id
                              ? "bg-gray-700 text-white border-b-2 border-yellow-400"
                              : "bg-gray-600 text-gray-300 hover:bg-gray-650"
                          }`}
                          onClick={() => onTabChange?.(tab.id)}
                        >
                          {tab.title.startsWith("Shell:") ? (
                            <TerminalIcon
                              className="mr-2 text-yellow-400"
                              fontSize="small"
                            />
                          ) : tab.title.startsWith("YAML:") ? (
                            <CodeIcon
                              className="mr-2 text-blue-400"
                              fontSize="small"
                            />
                          ) : null}
                          <span className="text-sm font-medium truncate max-w-48">
                            {tab.title}
                          </span>
                          {onTabClose && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTabClose(tab.id);
                              }}
                              className="ml-2 text-gray-400 hover:text-white rounded p-0.5"
                            >
                              <CloseIcon fontSize="small" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <h2 className="text-lg font-medium truncate">
                      {title || "Details"}
                    </h2>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={toggleMinimize}
                    className="flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded p-1 w-6 h-6"
                  >
                    {minimized ? (
                      <MaximizeIcon fontSize="small" />
                    ) : (
                      <MinimizeIcon fontSize="small" />
                    )}
                  </button>

                  <button
                    onClick={handleCloseClick}
                    className="text-gray-400 hover:text-white hover:bg-gray-700 rounded p-1"
                  >
                    <XMarkIcon fontSize="small" />
                  </button>
                </div>
              </div>

              {/* Resource Information Bar */}
              {tabs && tabs.length > 0 && activeTabId && !minimized && (
                <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-300">
                        {tabs
                          .find((tab) => tab.id === activeTabId)
                          ?.title?.startsWith("Shell:")
                          ? `Shell into ${tabs.find((tab) => tab.id === activeTabId)?.title?.replace("Shell: ", "")}`
                          : `Editing ${tabs.find((tab) => tab.id === activeTabId)?.title?.replace("YAML: ", "")} YAML`}
                      </span>
                    </div>
                    {tabs
                      .find((tab) => tab.id === activeTabId)
                      ?.title?.startsWith("YAML:") &&
                      isEdit && (
                        <button
                          onClick={onSave}
                          className="text-white bg-[#e76467ff] hover:bg-[#d55a5d] rounded px-3 py-1 text-sm font-medium transition-colors"
                        >
                          Save Changes
                        </button>
                      )}
                  </div>
                </div>
              )}

              <div
                className={`${minimized ? "h-10 overflow-hidden" : "flex-1 overflow-hidden"}`}
              >
                {tabs && tabs.length > 0 ? (
                  <div className="h-full w-full relative">
                    {tabs.map((tab) => (
                      <div
                        key={tab.id}
                        className={`absolute inset-0 h-full w-full ${
                          tab.id === activeTabId ? "visible" : "invisible"
                        }`}
                      >
                        {tab.content}
                      </div>
                    ))}
                  </div>
                ) : (
                  children
                )}
              </div>
            </div>
          </Transition.Child>
        </div>
      </Transition>

      {showUnsavedChangesModal && (
        <UnsavedChangesModal
          open={showConfirmModal}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmClose}
          title={unsavedModalTitle}
          message={unsavedModalMessage}
          cancelLabel={unsavedModalCancelLabel}
          confirmLabel={unsavedModalConfirmLabel}
        />
      )}
    </>
  );
};

export default ResizableBottomDrawer;
