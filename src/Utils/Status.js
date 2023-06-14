import React from 'react'

import { colors } from '../Theme/ThemeProvider'

const convertHexToRGB = hex => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ].join(', ') : null
}

export const statusColor = {
  RUNNING: colors.primary,
  UNKNOWN: colors.aluminium,
  ERROR: colors.secondary,
  OFFLINE: '#7A3BFF'
}

export const msvcStatusColor = {
  RUNNING: colors.primary,
  STARTED: colors.primary,
  PULLING: colors.green,
  UNKNOWN: colors.aluminium,
  QUEUED: colors.green,
  STARTING: colors.primary,
  STOPPED: '#7A3BFF',
  STOPPING: '#7A3BFF'
}

const defaultSize = 15

export default function Status ({ status, style, size = defaultSize }) {
  return (
    <div style={{
      ...style,
      width: size + 'px',
      height: size + 'px',
      borderRadius: size + 'px',
      backgroundColor: statusColor[status] || statusColor.UNKNOWN
    }}
    />)
}

export function MsvcStatus ({ status, style, size = defaultSize }) {
  const pulse = ['PULLING', 'STOPPING', 'STARTING'].includes(status)
  return (
    <div
      style={{
        ...style,
        width: size + 'px',
        height: size + 'px',
        borderRadius: size + 'px',
        zIndex: 2,
        '--color': convertHexToRGB(msvcStatusColor[status] || msvcStatusColor.UNKNOWN),
        backgroundColor: msvcStatusColor[status] || msvcStatusColor.UNKNOWN
      }}
      className={pulse ? 'pulse' : ''}
    />)
}
