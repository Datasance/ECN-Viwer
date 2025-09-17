import React, { Fragment, useState, useRef, useEffect } from "react";
import { Transition } from "@headlessui/react";
import XMarkIcon from "@material-ui/icons/CloseOutlined";
import MinimizeIcon from "@material-ui/icons/Minimize";
import MaximizeIcon from "@material-ui/icons/CheckBoxOutlineBlank";

import UnsavedChangesModal from "./UnsavedChangesModal";

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
        window.innerHeight - 100
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
                <h2 className="text-lg font-medium truncate">
                  {title || "Details"}
                </h2>
                <div className="flex gap-2 items-center">
                  {isEdit && !minimized && (
                    <button
                      onClick={onSave}
                      className="text-white bg-[#e76467ff] hover:bg-gray-700 rounded p-1 px-3"
                    >
                      Save Changes
                    </button>
                  )}
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

              <div className={`${minimized ? "h-10 overflow-hidden" : "flex-1 overflow-hidden"}`}>
                {children}
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
