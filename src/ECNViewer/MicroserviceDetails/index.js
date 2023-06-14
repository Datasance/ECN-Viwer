import React from 'react'

import ReactJson from '../../Utils/ReactJson'
import {
  Paper,
  Typography,
  makeStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  useMediaQuery
} from '@material-ui/core'

import { useData } from '../../providers/Data'
import getSharedStyle from '../sharedStyles'

import { icons, dateFormat, MiBFactor, prettyBytes } from '../utils'
import moment from 'moment'
import lget from 'lodash/get'
import Status, { MsvcStatus } from '../../Utils/Status'

import SearchBar from '../../Utils/SearchBar'
import Modal from '../../Utils/Modal'

const useStyles = makeStyles(theme => ({
  ...getSharedStyle(theme)
}))
export default function MicroserviceDetails ({ microservice: selectedMicroservice, selectApplication, selectAgent }) {
  const { data } = useData()
  const classes = useStyles()
  const [openDeleteMicroserviceDialog, setOpenDeleteMicroserviceDialog] = React.useState(false)
  const [openDetailsModal, setOpenDetailsModal] = React.useState(false)
  const [envFilter, setEnvFilter] = React.useState('')
  const [volumeFilter, setVolumeFilter] = React.useState('')
  const [hostFilter, sethostFilter] = React.useState('')
  const isMediumScreen = useMediaQuery('(min-width: 768px)')

  const { microservices, reducedAgents, reducedApplications } = data
  const microservice = (microservices || []).find(a => selectedMicroservice.uuid === a.uuid) || selectedMicroservice // Get live updates from data
  const agent = reducedAgents.byUUID[microservice.iofogUuid]

  const _getMicroserviceImage = m => {
    if (!agent) {
      return '--'
    }
    for (const img of microservice.images) {
      if (img.fogTypeId === agent.fogTypeId) {
        return img.containerImage
      }
    }
  }

  const env = microservice.env
    .filter(e =>
      lget(e, 'key', '').toLowerCase().includes(envFilter) ||
      lget(e, 'value', '').toString().toLowerCase().includes(envFilter))
  if (!env.lenght) {
    env.push({})
  }
  const volumes = microservice.volumeMappings
    .filter(vm =>
      lget(vm, 'hostDestination', '').toLowerCase().includes(volumeFilter) ||
      lget(vm, 'containerDestination', '').toLowerCase().includes(volumeFilter) ||
      lget(vm, 'accessMode', '').toLowerCase().includes(volumeFilter) ||
      lget(vm, 'type', '').toLowerCase().includes(volumeFilter))
  if (!volumes.lenght) {
    volumes.push({})
  }
  const ports = microservice.ports.length ? microservice.ports : [{}]
  const extraHosts = microservice.extraHosts
    .filter(e =>
      lget(e, 'name', '').toLowerCase().includes(hostFilter) ||
      lget(e, 'value', '').toLowerCase().includes(hostFilter) ||
      lget(e, 'address', '').toLowerCase().includes(hostFilter))
  if (!extraHosts.lenght) {
    extraHosts.push({})
  }

  const application = reducedApplications.byName[microservice.application]

  const mainActions = (
    <div className={classes.actions} style={{ minWidth: 0 }}>
      <icons.DeleteIcon onClick={() => setOpenDeleteMicroserviceDialog(true)} className={classes.action} title='Delete application' />
    </div>
  )

  const detailActions = (
    <div className={classes.actions} style={{ minWidth: 0 }}>
      <icons.CodeIcon onClick={() => setOpenDetailsModal(true)} className={classes.action} title='Details' />
    </div>
  )

  return (
    <>
      <Paper className={`section first ${classes.multiSections}`}>
        <div className={[classes.section, 'paper-container-left', classes.bottomPad].join(' ')}>
          <Typography variant='subtitle2' className={classes.title}>
            <span>Status</span>
            {!isMediumScreen && mainActions}
          </Typography>
          <span className={classes.text} style={{ display: 'flex', alignItems: 'center' }}><MsvcStatus status={microservice.status.status} style={{ marginRight: '5px', marginTop: '-3px' }} />{microservice.status.status}{microservice.status.status === 'PULLING' && ` (${microservice.status.percentage.toFixed(2)}%)`}</span>
          {microservice.status.errorMessage && <span className={classes.subTitle}>Error: <span className={classes.text}>{microservice.status.errorMessage}</span></span>}
        </div>
        <div className={classes.sectionDivider} />
        <div className={[classes.section, 'paper-container-right'].join(' ')} style={{ paddingBottom: '15px' }}>
          <Typography variant='subtitle2' className={classes.title}>
            <span>Description</span>
            {isMediumScreen && mainActions}
          </Typography>
          <span className={classes.text}>{microservice.description}</span>
        </div>
      </Paper>
      <Paper className={`section ${classes.multiSections}`}>
        <div className={[classes.section, 'paper-container-left'].join(' ')}>
          <Typography variant='subtitle2' className={classes.title}>
            <span>Microservices Details</span>
            {!isMediumScreen && detailActions}
          </Typography>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>Image</span>
            <span className={classes.text}>{_getMicroserviceImage(microservice)}</span>
          </div>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>Application</span>
            <span className={`${classes.text} ${classes.action}`} onClick={() => selectApplication(application)}><span style={{ display: 'flex', alignItems: 'center' }}><Status status={application.isActivated ? 'RUNNING' : 'UNKNOWN'} size={10} style={{ marginRight: '5px', '--pulse-size': '5px' }} /><span />{application.name}</span></span>
          </div>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>Agent</span>
            {agent ? <span className={`${classes.text} ${classes.action}`} onClick={() => selectAgent(agent)}><span style={{ display: 'flex', alignItems: 'center' }}><Status status={agent.daemonStatus} size={10} style={{ marginRight: '5px', '--pulse-size': '5px' }} /><span />{agent.name}</span></span> : ''}
          </div>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>Created at</span>
            <span className={classes.text}>{moment(microservice.createdAt).format(dateFormat)}</span>
          </div>
        </div>
        <div className={classes.sectionDivider} />
        <div className={[classes.section, 'paper-container-right'].join(' ')} style={{ paddingBottom: '15px' }}>
          <Typography variant='subtitle2' className={classes.title}>
            <span>Resources Utilization</span>
            {isMediumScreen && detailActions}
          </Typography>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>CPU Usage</span>
            <span className={classes.text}>{(microservice.status.cpuUsage * 1).toFixed(2) + '%'}</span>
          </div>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>Memory Usage</span>
            <span className={classes.text}>{`${prettyBytes((microservice.status.memoryUsage || 0 * MiBFactor))} / ${prettyBytes((agent.systemAvailableMemory || 0))} (${((microservice.status.memoryUsage / agent.systemAvailableMemory * 100) || 0).toFixed(2)}%)`}</span>
          </div>
        </div>
      </Paper>
      <Paper className='section'>
        <div className='section-container'>
          <div className={[classes.section, classes.cardTitle, 'paper-container-left', 'paper-container-right'].join(' ')}>
            <Typography variant='subtitle2' className={classes.title}>
              <span className={classes.stickyLeft}>Ports</span>
            </Typography>
          </div>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>Internal</TableCell>
                <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>External</TableCell>
                <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>Protocol</TableCell>
                <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>PublicLink</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ports.map((p) => (
                <TableRow key={p.external} hover classes={{ hover: classes.tableRowHover }}>
                  <TableCell component='th' scope='row'>
                    {p.internal}
                  </TableCell>
                  <TableCell>
                    {p.external}
                  </TableCell>
                  <TableCell>
                    {p.protocol ? (p.protocol === 'udp' ? p.protocol : 'tcp') : ''}
                  </TableCell>
                  <TableCell>
                    <a className={classes.link} href={p.publicLink} target='_blank' rel='noopener noreferrer'>{p.publicLink}</a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Paper>
      <Paper className='section'>
        <div className='section-container'>
          <div className={[classes.section, classes.cardTitle, 'paper-container-left', 'paper-container-right'].join(' ')}>
            <Typography variant='subtitle2' className={classes.title}>
              <span className={classes.stickyLeft}>Volumes</span>
              <SearchBar onSearch={setVolumeFilter} inputClasses={{ root: classes.narrowSearchBar }} classes={{ root: classes.stickyRight }} />
            </Typography>
          </div>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>Host</TableCell>
                <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>Container</TableCell>
                <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>Acces Mode</TableCell>
                <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {volumes
                .map((p) => (
                  <TableRow key={p.containerDestination} hover classes={{ hover: classes.tableRowHover }}>
                    <TableCell component='th' scope='row'>
                      {p.hostDestination}
                    </TableCell>
                    <TableCell>
                      {p.containerDestination}
                    </TableCell>
                    <TableCell>
                      {p.accessMode}
                    </TableCell>
                    <TableCell>
                      {p.fogTypeId}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Paper>
      <Paper className='section'>
        <div className='section-container'>
          <div className={[classes.section, classes.cardTitle, 'paper-container-left', 'paper-container-right'].join(' ')}>
            <Typography variant='subtitle2' className={classes.title}>
              <span className={classes.stickyLeft}>Environment variables</span>
              <SearchBar onSearch={setEnvFilter} inputClasses={{ root: classes.narrowSearchBar }} classes={{ root: classes.stickyRight }} />
            </Typography>
          </div>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px', maxWidth: '200px' }}>Key</TableCell>
                <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px', maxWidth: '200px' }}>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {env
                .map((p) => (
                  <TableRow key={p.key} hover classes={{ hover: classes.tableRowHover }}>
                    <TableCell component='th' scope='row' style={{ maxWidth: '200px' }}>
                      {p.key}
                    </TableCell>
                    <TableCell style={{ maxWidth: '200px', wordWrap: 'break-word' }}>
                      {p.value}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Paper>
      <Paper className='section'>
        <div className='section-container'>
          <div className={[classes.section, classes.cardTitle, 'paper-container-left', 'paper-container-right'].join(' ')}>
            <Typography variant='subtitle2' className={classes.title}>
              <span className={classes.stickyLeft}>Extra hosts</span>
              <SearchBar onSearch={sethostFilter} inputClasses={{ root: classes.narrowSearchBar }} classes={{ root: classes.stickyRight }} />
            </Typography>
          </div>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>Name</TableCell>
                <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>Address</TableCell>
                <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {extraHosts
                .map((p) => (
                  <TableRow key={p.name} hover classes={{ hover: classes.tableRowHover }}>
                    <TableCell component='th' scope='row'>
                      {p.name}
                    </TableCell>
                    <TableCell>
                      {p.address}
                    </TableCell>
                    <TableCell>
                      {p.value}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Paper>
      <Dialog
        open={openDeleteMicroserviceDialog}
        onClose={() => { setOpenDeleteMicroserviceDialog(false) }}
      >
        <DialogTitle id='alert-dialog-title'>Delete {microservice.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            <span>This is not reversible.</span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteMicroserviceDialog(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpenDeleteMicroserviceDialog(false)} color='secondary' autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Modal
        {...{
          open: openDetailsModal,
          title: `${microservice.name} details`,
          onClose: () => setOpenDetailsModal(false),
          size: 'lg'
        }}
      >
        <ReactJson title='Microservice' src={microservice} name={false} />
      </Modal>
    </>
  )
}
