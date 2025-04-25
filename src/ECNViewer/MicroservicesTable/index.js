import React from 'react'

import { Table, TableHead, TableRow, TableBody, TableCell, makeStyles } from '@material-ui/core'

import getSharedStyle from '../sharedStyles'

import Status, { MsvcStatus } from '../../Utils/Status'
import { useData } from '../../providers/Data'

const useStyles = makeStyles(theme => ({
  ...getSharedStyle(theme)
}))

export default function MicroservicesTable ({ application, selectMicroservice, selectAgent, nameTitle, showVolumes, filter = '' }) {
  const classes = useStyles()
  const { data } = useData()

  const { reducedAgents } = data

  const microservices = application.microservices?.filter(m => (
    m.name.toLowerCase().includes(filter) ||
    m.status.status.toLowerCase().includes(filter) ||
    (selectAgent && (reducedAgents.byUUID[m.iofogUuid] || { name: '' }).name.toLowerCase().includes(filter))
  ))
  if (!microservices?.length) {
    microservices?.push({ uuid: 'filler' })
  }

  return (
    <Table stickyHeader>
      <TableHead>
        <TableRow>
          <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>{nameTitle || 'Name'}</TableCell>
          <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>Status</TableCell>
          {selectAgent && <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>Agent</TableCell>}
          <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>Ports</TableCell>
          {showVolumes && <TableCell className={classes.tableTitle} classes={{ stickyHeader: classes.stickyHeaderCell }} style={{ top: '54px' }}>Volumes</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {microservices?.map((row) => {
          if (!row.name) {
            return <TableRow key={row.uuid}><TableCell colSpan={5} /></TableRow>
          }
          const agent = reducedAgents.byUUID[row.iofogUuid]
          return (
            <TableRow key={row.uuid} style={{ verticalAlign: 'baseline' }} hover classes={{ hover: classes.tableRowHover }}>
              <TableCell component='th' scope='row' className={classes.action} onClick={() => selectMicroservice(row)} style={{ width: '200px' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}><MsvcStatus status={row.status?.status} size={10} style={{ marginRight: '5px', '--pulse-size': '5px' }} />{row.name}</span>
              </TableCell>
              <TableCell style={{ width: '200px' }}>
                <span>{row.status?.status}{row.status?.status === 'PULLING' && ` (${row.status?.percentage !== undefined ? row.status?.percentage.toFixed(2): 0}%)`}</span>
                {row.status?.errorMessage && <><br /><span>{row.status?.errorMessage}</span></>}
              </TableCell>
              {selectAgent &&
                <TableCell className={classes.action} onClick={() => agent ? selectAgent(agent) : null} style={{ width: '200px' }}>
                  {agent && <span style={{ display: 'flex', alignItems: 'center' }}><Status status={agent.daemonStatus} size={10} style={{ marginRight: '5px', '--pulse-size': '5px' }} /><span />{agent.name}</span>}
                </TableCell>}
              <TableCell style={{ width: '200px' }}>
                {row.ports.map(p => (
                  <div key={p.internal} style={{ paddingBottom: '5px' }}>{p.internal}:{p.external}/{p.protocol === 'udp' ? 'udp' : 'tcp'}</div>
                ))}
              </TableCell>
              {showVolumes &&
                <TableCell style={{ width: '200px' }}>
                  {row.volumeMappings.map(p => (
                    <div key={p.id} style={{ paddingBottom: '5px' }}>{p.hostDestination}:{p.containerDestination}:{p.accessMode}</div>
                  ))}
                </TableCell>}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
