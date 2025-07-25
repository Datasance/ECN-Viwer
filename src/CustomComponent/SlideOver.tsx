import React, { Fragment, useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import XMarkIcon from '@material-ui/icons/CloseOutlined';
import RestartAltIcon from '@material-ui/icons/ReplayOutlined';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import PlayCircleFilledOutlined from '@material-ui/icons/PlayCircleFilledOutlined';
import StopOutlined from '@material-ui/icons/StopOutlined';
import PublishOutlined from '@material-ui/icons/PublishOutlined';
import DescriptionOutlined from '@material-ui/icons/DescriptionOutlined';

type Field<T> = {
  label: string;
  render: (data: T) => React.ReactNode;
  isSectionHeader?: boolean;
  isFullSection?: boolean;
};

type SlideOverProps<T> = {
  open: boolean;
  onClose: () => void;
  title?: string;
  data: T | null;
  fields: Field<T>[];
  onRestart?: () => void;
  onDelete?: () => void;
  onStartStop?: () => void;
  startStopValue?: string;
  onEditYaml?: () => void;
  onPublish?: () => void;
  onDetails?: () => void;
  onClean?: () => void;
  customWidth?: number;
};

const SlideOver = <T,>({
  open,
  onClose,
  title,
  data,
  fields,
  onRestart,
  onStartStop,
  startStopValue,
  onDelete,
  onEditYaml,
  onPublish,
  onDetails,
  onClean,
  customWidth
}: SlideOverProps<T>) => {
  const [width, setWidth] = useState(customWidth ? customWidth : 480);
  const isResizing = useRef(false);

  const startResizing = () => {
    isResizing.current = true;
  };

  const stopResizing = () => {
    isResizing.current = false;
  };

  const resize = (e: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = window.innerWidth - e.clientX;
      const clamped = Math.min(Math.max(newWidth, 320), window.innerWidth - 100);
      setWidth(clamped);
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, []);

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel
                  className="pointer-events-auto h-full max-h-screen bg-gray-800 text-white shadow-xl overflow-y-auto relative flex flex-col w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl"
                  style={{ width }}
                >
                  <div
                    onMouseDown={startResizing}
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-50 bg-gray-700 hover:bg-gray-600 hidden sm:block"
                  />

                  <div className="flex items-start justify-between p-4 border-b border-gray-700">
                    <Dialog.Title className="text-lg font-medium">
                      {title || 'Details'}
                    </Dialog.Title>
                    <div className="flex items-center gap-2">
                      {onClean && (
                        <button onClick={onClean} className="hover:text-green-600 hover:bg-white rounded">
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="m21 3l-8 8.5m-3.554-.415c-2.48.952-4.463.789-6.446.003c.5 6.443 3.504 8.92 7.509 9.912c0 0 3.017-2.134 3.452-7.193c.047-.548.07-.821-.043-1.13c-.114-.309-.338-.53-.785-.973c-.736-.728-1.103-1.092-1.54-1.184c-.437-.09-1.007.128-2.147.565"/><path d="M4.5 16.446S7 16.93 9.5 15m-1-7.75a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0M11 4v.1"/></g></svg>

                        </button>
                      )}
                      {onPublish && (
                        <button onClick={onPublish} className="hover:text-green-600 hover:bg-white rounded">
                          <PublishOutlined fontSize="small" />
                        </button>
                      )}
                      {onDetails && (
                        <button onClick={onDetails} className="hover:text-green-600 hover:bg-white rounded">
                          <DescriptionOutlined fontSize="small" />
                        </button>
                      )}
                      {onEditYaml && (
                        <button onClick={onEditYaml} className="hover:text-green-600 hover:bg-white rounded">
                          <EditOutlinedIcon fontSize="small" />
                        </button>
                      )}
                      {onStartStop && (
                        !startStopValue ?
                          <button onClick={onStartStop} className="hover:text-green-600 hover:bg-white rounded">
                            <PlayCircleFilledOutlined fontSize="small" />
                          </button> :
                          <button onClick={onStartStop} className="hover:text-red-600 hover:bg-white rounded">
                            <StopOutlined fontSize="default" />
                          </button>
                      )}
                      {onRestart && (
                        <button onClick={onRestart} className="hover:text-green-600 hover:bg-white rounded">
                          <RestartAltIcon fontSize="small" />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={onDelete} className="hover:text-red-600 hover:bg-white rounded">
                          <DeleteOutlineIcon fontSize="small" />
                        </button>
                      )}
                      <button onClick={onClose} className="hover:text-black hover:bg-white rounded">
                        <XMarkIcon fontSize="small" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
                    {data ? (
                      <dl className="divide-y divide-gray-700">
                        {fields.map((field, idx) =>
                          field.isSectionHeader ? (
                            <div key={idx} className="py-3">
                              <h3 className="text-lg font-semibold text-white">
                                {field.label}
                              </h3>
                            </div>
                          ) : field.isFullSection ? (
                            <div key={idx} className="py-3 flex flex-col">
                              <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-3">
                                {field.render(data)}
                              </dd>
                            </div>
                          ) : (
                            <div
                              key={idx}
                              className="py-3 sm:grid sm:grid-cols-[minmax(120px,150px)_1fr] sm:gap-2 flex flex-col"
                            >
                              <dt className="text-sm font-medium text-gray-300 content-center">
                                {field.label}
                              </dt>
                              <dd className="mt-1 text-sm text-white sm:mt-0 truncate min-h-6">
                                {field.render(data)}
                              </dd>
                            </div>
                          )
                        )}
                      </dl>
                    ) : (
                      <p className="text-sm text-gray-400">No data available.</p>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SlideOver;
