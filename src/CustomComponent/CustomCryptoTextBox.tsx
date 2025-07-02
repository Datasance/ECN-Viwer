import React, { useState, useMemo } from 'react';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';

type Props = {
  data: string;
};

const CryptoTextBox: React.FC<Props> = ({ data }) => {
  const [visible, setVisible] = useState(false);

  const encoded = useMemo(() => {
    return btoa(unescape(encodeURIComponent(data)));
  }, [data]);

  const decoded = useMemo(() => {
    try {
      return decodeURIComponent(escape(atob(encoded)));
    } catch {
      return 'Invalid data';
    }
  }, [encoded]);

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        value={visible ? decoded : encoded}
        readOnly
        className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none wrap-break-word"
      />
      <button
        onClick={() => setVisible(!visible)}
        className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-300 hover:text-white bg-gray-800"
      >
        {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
      </button>
    </div>
  );
};

export default CryptoTextBox;
