import React from 'react'
import Skeleton from 'react-loading-skeleton'

import { Table, TableHead, TableBody, TableRow, TableCell, Divider, Menu, MenuItem, Dialog, DialogContent, DialogActions, DialogTitle, DialogContentText, Button } from '@material-ui/core'

import MoreIcon from '@material-ui/icons/MoreVert'

import { makeStyles } from '@material-ui/styles'

import { useController } from '../../../ControllerProvider'
import { useFeedback } from '../../../Utils/FeedbackContext'

import getSharedStyle from '../../sharedStyles/'
import Status from '../../../Utils/Status'

const useStyles = makeStyles(theme => ({
  ...getSharedStyle(theme),
  avatarList: {
    color: 'white',
    backgroundColor: 'var(--statusColor, white)',
    boxShadow: `0px 2px 2px ${theme.colors.neutral}`
  },
  msvcChipList: {
    display: 'flex',
    flexDirection: 'column',
    width: '20%',
    flex: '1',
    paddingRight: '15px'
  },
  msvcChip: {
    marginTop: 'var(--mTop, 0px)',
    backgroundColor: `var(--color, ${theme.colors.cobalt})`,
    fontSize: '10px',
    borderRadius: '5px',
    height: '20px',
    margin: '2px',
    width: '100px',
    color: 'white',
    '& .MuiChip-label': {
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      display: 'block'
    }
  },
  jsonDisplay: {
    width: '99%',
    minHeight: '30rem',
    fontFamily: '"Lucida Console", Monaco, monospace',
    fontSize: '0.8rem',
    lineHeight: '1.2'
  },
  listTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    color: theme.palette.text.primary,
    padding: '20px'
  },
  stickyHeader: {
    ...(getSharedStyle(theme).stickyHeaderCell),
    top: '78px'
  }
}))

export default function ApplicationList ({ applications: unfilteredApplications, filter, loading, application, agents, selectApplication }) {
  const classes = useStyles()
  const { request } = useController()
  const { pushFeedback } = useFeedback()
  const [openStartStopModal, setOpenStartStopModal] = React.useState(false)
  const [openDeleteApplicationModal, setOpenDeleteApplicationModal] = React.useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null)
  const [applicationMenu, setApplicationMenu] = React.useState(unfilteredApplications[0] || {})

  const applications = unfilteredApplications.filter(a => a.name.toLowerCase().includes(filter))

  const handleCloseMenu = () => setMenuAnchorEl(null)
  const openMenu = (a, e) => {
    setApplicationMenu(a)
    setMenuAnchorEl(e.currentTarget)
  }
  const openStartStop = () => {
    setOpenStartStopModal(true)
    handleCloseMenu()
  }
  const openDeleteApplication = () => {
    setOpenDeleteApplicationModal(true)
    handleCloseMenu()
  }

  const toggleApplication = async (application) => {
    try {
      const res = await request(`/api/v3/application/${application.name}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ isActivated: !application.isActivated })
      })
      if (res.ok) {
        application.isActivated = !application.isActivated
        pushFeedback({ message: application.isActivated ? 'Application stopped!' : 'Application started!', type: 'success' })
        setOpenStartStopModal(false)
      } else {
        pushFeedback({ message: res.statusText, type: 'error' })
      }
    } catch (e) {
      pushFeedback({ message: e.message, type: 'error' })
    }
  }

  const deleteApplication = async (application) => {
    try {
      const res = await request(`/api/v3/application/${application.name}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        pushFeedback({ message: 'Application deleted!', type: 'success' })
        setOpenDeleteApplicationModal(false)
      } else {
        pushFeedback({ message: res.statusText, type: 'error' })
      }
    } catch (e) {
      pushFeedback({ message: e.message, type: 'error' })
    }
  }

  return (
    <>
      {/* <div className={classes.listTitle}>
        <FileDrop {...{ onDrop: readApplicationFile, loading: fileParsing }}>
          <div className={classes.flexColumn}>
            <input onChange={handleFileInput} class='box__file' type='file' name='files[]' id='file' className={classes.hiddenInput} />
            <span>
              {'To deploy an app, drag a YAML file here or '}
              <label for='file' className={classes.link} style={{ marginRight: '5px', textDecoration: 'underline' }}>upload</label>
            </span>
          </div>
        </FileDrop>
      </div> */}
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeader, root: classes.headerCell }}>Name</TableCell>
            <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeader, root: classes.headerCell }}>Msvcs</TableCell>
            <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeader, root: classes.headerCell }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {(loading ? (new Array(5)).fill(0).map((v, idx) => <TableRow key={idx}><TableCell colSpan={4}><Skeleton height={29} /></TableCell></TableRow>) : applications.map(a => {
            return (
              <TableRow button key={a.uuid} classes={{ hover: classes.tableRowHover }} hover>
                <TableCell onClick={() => selectApplication(a)} classes={{ root: classes.tableCell }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Status status={a.isActivated ? 'RUNNING' : 'OFFLINE'} />
                    <span className={classes.action} style={{ marginLeft: '15px' }}>{a.name}</span>
                  </div>
                </TableCell>
                <TableCell classes={{ root: classes.tableCell }}>{a.microservices.length}</TableCell>
                <TableCell classes={{ root: classes.tableCell }}>
                  <MoreIcon className={classes.action} onClick={(e) => { e.stopPropagation(); openMenu(a, e) }} />
                </TableCell>
              </TableRow>
            )
          }))}
        </TableBody>
      </Table>
      <Dialog
        open={openStartStopModal}
        onClose={() => setOpenStartStopModal(false)}
      >
        <DialogTitle id='alert-dialog-title'>{`${applicationMenu.isActivated ? 'Stop' : 'Start'} ${applicationMenu.name}?`}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            {applicationMenu.isActivated ? 'Stopping an application will stop all its microservices' : 'Starting an application will start all its microservices'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStartStopModal(false)}>
            Cancel
          </Button>
          <Button onClick={() => toggleApplication(applicationMenu)} color={applicationMenu.isActivated ? 'secondary' : 'primary'} autoFocus>
            {applicationMenu.isActivated ? 'Stop' : 'Start'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openDeleteApplicationModal}
        onClose={() => setOpenDeleteApplicationModal(false)}
      >
        <DialogTitle id='alert-dialog-title'>Delete {applicationMenu.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            <span>Deleting an application will delete all its microservices.</span><br />
            <span>This is not reversible.</span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteApplicationModal(false)}>
            Cancel
          </Button>
          <Button onClick={() => deleteApplication(applicationMenu)} color='secondary' autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Menu
        id='agent-menu'
        anchorEl={menuAnchorEl}
        keepMounted
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => selectApplication(applicationMenu)}>Details</MenuItem>
        <Divider />
        <MenuItem onClick={openStartStop}>{`${applicationMenu.isActivated ? 'Stop' : 'Start'}`}</MenuItem>
        <MenuItem onClick={openDeleteApplication}>Delete</MenuItem>
      </Menu>
    </>
  )
}
