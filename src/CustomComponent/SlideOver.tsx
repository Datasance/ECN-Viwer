import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import XMarkIcon from '@material-ui/icons/CloseOutlined';
import RestartAltIcon from '@material-ui/icons/ReplayOutlined';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';

type Field<T> = {
    isSectionHeader?: any;
    label: string;
    render: (data: T) => React.ReactNode;
};

type SlideOverProps<T> = {
    open: boolean;
    onClose: () => void;
    title?: string;
    data: T | null;
    fields: Field<T>[];
    onRestart?: () => void;
    onDelete?: () => void;
};

const SlideOver = <T,>({
    open,
    onClose,
    title,
    data,
    fields,
    onRestart,
    onDelete,
}: SlideOverProps<T>) => {
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
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md bg-gray-800 text-white shadow-xl">
                                    <div className="flex items-start justify-between p-4 border-b border-gray-700">
                                        <Dialog.Title className="text-lg font-medium">
                                            {title || 'Details'}
                                        </Dialog.Title>
                                        <div className="flex items-center gap-2">
                                            {onRestart && (
                                                <button onClick={onRestart} className="text-white-400 hover:text-green-600 hover:bg-white rounded">
                                                    <RestartAltIcon fontSize="small" />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button onClick={onDelete} className="text-white-500 hover:text-red-600 hover:bg-white rounded">
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </button>
                                            )}
                                            <button onClick={onClose} className="text-gray-400 hover:text-black  hover:bg-white rounded">
                                                <XMarkIcon fontSize="small" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-4">
                                        <h2 className="text-sm text-gray-400">Properties</h2>
                                        {data ? (
                                            <dl className="divide-y divide-gray-700">
                                                {fields.map((field, idx) =>
                                                    field.isSectionHeader ? (
                                                        <div key={idx} className="py-3">
                                                            <h3 className="text-lg font-semibold text-white">
                                                                {field.label}
                                                            </h3>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            key={idx}
                                                            className="py-3 sm:grid sm:grid-cols-5 sm:gap-4 flex flex-col"
                                                        >
                                                            <dt className="text-sm font-medium text-gray-300 sm:col-span-2">
                                                                {field.label}
                                                            </dt>
                                                            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-3">
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
