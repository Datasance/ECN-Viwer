import React from 'react'
import { Modal, Paper, Button } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'

import { makeStyles } from '@material-ui/styles'
const useStyles = makeStyles(theme => ({
  modalTitle: {
    // backgroundColor: theme.colors.carbon,
    borderRadius: '4px 4px 0 0',
    // color: 'white',
    padding: '25px 15px',
    display: 'flex',
    fontSize: '24px',
    fontWeight: '700',
    justifyContent: 'space-between',
    textTransform: 'uppercase',
    '@media screen and (min-width: 992px)': {
      padding: '25px 50px'
    }
  },
  modal: {
    position: 'relative',
    margin: 'auto',
    top: '15%',
    borderRadius: '4pxpx',
    '&:focus': {
      outline: 'none'
    }
  },
  lg: {
    width: '90%',
    '@media screen and (min-width: 768px)': {
      width: '75%'
    },
    '@media screen and (min-width: 992px)': {
      width: '60%'
    }
  },
  sm: {
    width: '90%',
    '@media screen and (min-width: 768px)': {
      width: '60%'
    },
    '@media screen and (min-width: 992px)': {
      width: '40%'
    }
  },
  xl: {
    width: '90%',
    '@media screen and (min-width: 992px)': {
      width: '80%'
    }
  },
  modalContent: {
    maxHeight: '600px',
    overflowY: 'auto',
    padding: '15px',
    paddingTop: '0px',
    paddingBottom: '25px',
    '@media screen and (min-width: 992px)': {
      padding: '50px'
    }
  },
  modalActions: {
    display: 'flex',
    backgroundColor: theme.colors.silver,
    alignItems: 'flex-end'
  },
  modalAction: {
    marginLeft: '5px'
  }
}))

export default function _Modal (props) {
  const classes = useStyles()
  const { title, open, onClose } = props
  const classNames = [classes.modal, classes[props.size] || classes.sm].join(' ')

  const customStyle = props.style || {}
  return (
    <Modal
      aria-labelledby={`${title} modal`}
      {...{
        open,
        onClose
      }}
    >
      <Paper className={classNames}>
        <div className={classes.modalTitle}>
          <div>{title}</div>
          <CloseIcon style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>
        <div className={classes.modalContent} style={{ ...customStyle.modalContent }}>
          {props.children}
        </div>
        {props.actions && !!props.actions.length &&
          <div className={classes.modalActions}>
            {props.actions.map(a => <Button key={a.text} className={`${a.className} ${classes.modalAction}`} {...{ variant: a.variant, onClick: a.onClick }}>{a.text}</Button>)}
          </div>}
      </Paper>
    </Modal>
  )
}
