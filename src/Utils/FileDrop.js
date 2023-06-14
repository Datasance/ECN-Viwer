import React from 'react'
import { useDrop } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'
import { makeStyles } from '@material-ui/core/styles'
import { CircularProgress } from '@material-ui/core'

const { FILE } = NativeTypes

const useStyles = makeStyles(theme => ({
  dropZone: {
    // width: '100%',
    border: `1px dashed ${theme.colors.neutral_2}`,
    minHeight: '39px',
    // padding: '1rem',
    verticalAlign: 'center',
    borderRadius: '4px',
    // background: 'aliceblue',
    color: theme.colors.neutral_3,
    fontStyle: 'italic',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingLeft: '15px',
    paddingRight: '15px',
    '& label': {
      color: theme.colors.neutral_3
    }
  },
  active: {
    backgroundColor: '#d8dfe5'
    // border: '1px solid'
  }
}))

export default function FileDrop (props) {
  const classes = useStyles()
  const [collectedProps, drop] = useDrop({
    accept: FILE,
    drop: props.onDrop,
    collect: (monitor) => ({
      highlighted: monitor.canDrop(),
      hovered: monitor.isOver()
    })
  })

  const active = collectedProps.hovered && collectedProps.highlighted
  const className = [
    classes.dropZone,
    (collectedProps.hovered ? classes.hovered : ''),
    (collectedProps.highlighted ? classes.highlighted : ''),
    (active ? classes.active : '')
  ].join(' ')

  return props.loading
    ? (
      <div className={className} style={{ ...props.style, display: 'flex', alignItems: 'center' }}><CircularProgress color='primary' size={24} /></div>
    )
    : (
      <div className={className} ref={drop} style={props.style}>
        {active ? (props.onHover || 'Release to drop') : props.children}
      </div>
    )
}
