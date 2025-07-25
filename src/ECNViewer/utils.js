import { theme } from '../Theme/ThemeProvider'

import PlayIcon from '@material-ui/icons/PlayArrow'
import StopIcon from '@material-ui/icons/Stop'
import RestartIcon from '@material-ui/icons/Replay'
import DetailsIcon from '@material-ui/icons/ArrowForward'
import DeleteIcon from '@material-ui/icons/Delete'
import CodeIcon from '@material-ui/icons/Code'
import SettingsBackupRestoreIcon from '@material-ui/icons/SettingsBackupRestore';
import ReplayIcon from '@material-ui/icons/Replay';

import _prettyBytes from 'pretty-bytes'
import { statusColor as _statusColor, msvcStatusColor as _msvcStatusColor } from '../Utils/Status'

export const statusColor = _statusColor
export const msvcStatusColor = _msvcStatusColor

export const tagColor = theme.colors.neutral_3

export const dateFormat = 'YYYY/MM/DD hh:mm:ss a'
export const MiBFactor = 1048576

export const fogTypes = {
  0: 'auto-detect',
  1: 'x86',
  2: 'ARM'
}

export const icons = {
  PlayIcon,
  StopIcon,
  RestartIcon,
  DetailsIcon,
  DeleteIcon,
  CodeIcon,
  SettingsBackupRestoreIcon,
  ReplayIcon
}

export const colors = theme.colors

export const prettyBytes = (number) => {
  if (typeof number !== typeof 42) { return _prettyBytes(0) }
  return _prettyBytes(number)
}

export function getTextColor(bgColor) {
  const whiteTextColors = [
    '#16A34A',
    '#EF4444',
    '#DC2626',
    '#3B82F6',
    '#7A3BFF'
  ];
  return whiteTextColors.includes(bgColor) ? 'white' : 'black';
}
