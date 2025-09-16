import React, { Fragment, useState, useRef, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import XMarkIcon from "@material-ui/icons/CloseOutlined";
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
  const isResizing = useRef(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const startResizing = () => {
    isResizing.current = true;
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

  return (
    <>
      <Transition show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseClick}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 flex items-end justify-center">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-y-full"
                enterTo="translate-y-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-y-0"
                leaveTo="translate-y-full"
              >
                <Dialog.Panel
                  className="w-full bg-gray-800 text-white rounded-t-xl shadow-xl flex flex-col"
                  style={{ height }}
                >
                  <div
                    className="w-full h-3 cursor-row-resize bg-gray-700 rounded-t-xl"
                    onMouseDown={startResizing}
                  />

                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <Dialog.Title className="text-lg font-medium">
                      {title || "Details"}
                    </Dialog.Title>
                    <div className="flex gap-2 items-center">
                      {isEdit && (
                        <button
                          onClick={onSave}
                          className="text-white bg-[#e76467ff] hover:bg-gray-700 rounded p-1 px-3"
                        >
                          Save Changes
                        </button>
                      )}
                      <button
                        onClick={handleCloseClick}
                        className="text-gray-400 hover:text-white hover:bg-gray-700 rounded p-1"
                      >
                        <XMarkIcon fontSize="small" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    {children}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
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
