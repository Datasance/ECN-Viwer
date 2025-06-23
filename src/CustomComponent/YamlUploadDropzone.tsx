import React, { useCallback, useRef, useState } from 'react';
import CloudUploadRounded from '@material-ui/icons/CloudUploadRounded';
type Props = {
    onUpload?: (file: File) => void;
};

const YamlUploadDropzone: React.FC<Props> = ({ onUpload }) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFiles = useCallback(
        (files: FileList | null) => {
            if (!files || files.length === 0) return;
            const file = files[0];
            if (!file.name.endsWith('.yaml') && !file.name.endsWith('.yml')) {
                alert('Only YAML files are allowed');
                return;
            }
            if (onUpload) {
                onUpload(file);
            }
        },
        [onUpload]
    );

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`h-[2rem] ml-2 flex border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${isDragging ? '!border-blue-100 bg-blue-50' : '!border-gray-100'
                }`}
            onClick={handleClick}
        >
            <div className="flex items-center justify-center gap-2 text-gray-500">
                <CloudUploadRounded fontSize="default" className='text-white' />
                <span className="text-sm text-white">
                    To add a template, drag a YAML file here or{' '}
                    <span className="underline text-blue-300">upload</span>
                </span>
            </div>
            <input
                type="file"
                accept=".yaml,.yml"
                ref={fileInputRef}
                onChange={handleInputChange}
                className="hidden"
            />
        </div>
    );
};

export default YamlUploadDropzone;
