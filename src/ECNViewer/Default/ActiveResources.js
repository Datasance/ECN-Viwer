import React from 'react'

import { Paper } from '@material-ui/core'

import { makeStyles } from '@material-ui/styles'
import { useData } from '../../providers/Data'
const useStyles = makeStyles(theme => ({
  summary: {
    marginTop: '15px',
    marginBottom: '15px',
    gridGap: '15px',
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    textAlign: 'center',
    '@media (min-width: 1200px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    }
  },
  container: {
    display: 'flex',
    height: '100px',
    paddingLeft: '15px',
    paddingRight: '15px',
    alignItems: 'center'
  },
  mainNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '400',
    fontSize: '60px',
    marginRight: '15px',
    color: theme.colors.datasance_color_0,
    flex: '2 1 0px',
    '@media (min-width: 1200px)': {
      flex: 'unset'
    }
  },
  detailsContainer: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    color: theme.colors.neutral_3,
    flex: '4 1 0px',
    '@media (min-width: 1200px)': {
      flex: 'unset'
    }
  },
  unitType: {
    fontSize: '14px',
    fontWeight: '500',
    textTransform: 'uppercase',
    color: theme.colors.datasance_color_2
  },
  detailsText: {
    fontSize: '11px',
    fontWeight: '500',
    color: theme.colors.datasance_color_1,
    textTransform: 'uppercase'
  },
  errorText: {
    color: theme.colors.error
  }
}))

export default function ActiveResources () {
  const classes = useStyles()
  const { data } = useData()
  const { controller, loading } = data
  const { agents, applications, microservices } = controller
  const applicationCount = applications.reduce((acc, app) => {
    if (app.isActivated) { acc.running += 1 } else { acc.stopped += 1 }
    // TODO: HAndle errored app
    return acc
  }, {
    running: 0,
    stopped: 0,
    error: 0
  })
  const agentCount = agents.reduce((acc, a) => {
    if (a.daemonStatus === 'RUNNING') { acc.running += 1 } else { acc.unknown += 1 }
    // TODO: HAndle errored app
    return acc
  }, {
    running: 0,
    unknown: 0,
    alert: 0
  })
  const microserviceCount = microservices.reduce((acc, a) => {
    if (a.status.status === 'RUNNING') {
      acc.running += 1
    } else if (a.status.status === 'FAILED') {
      acc.error += 1
    } else {
      acc.stopped += 1
    }
    return acc
  }, {
    running: 0,
    stopped: 0,
    error: 0
  })

  const _getMainNumberFontSize = (number) => {
    if (number >= 10000) {
      return '30px'
    }
    if (number >= 1000) {
      return '40px'
    }
    if (number >= 100) {
      return '50px'
    }
    return '60px'
  }

  const NbOfAgents = loading ? 0 : agents.length
  const NbOfApps = loading ? 0 : applications.length
  const NbOfMsvcs = loading ? 0 : microservices.length
  // const NbOfAgents = 999
  // const NbOfApps = 9999
  // const NbOfMsvcs = 99999

  return (
    <div>
      <div className={classes.summary}>
        <Paper className={classes.container}>
          <div className={classes.mainNumber} style={{ fontSize: _getMainNumberFontSize(NbOfAgents) }}>
            <div>{NbOfAgents}</div>
          </div>
          <div className={classes.detailsContainer}>
            <div className={classes.unitType}>Agents</div>
            <div className={classes.detailsText}>{agentCount.running} running</div>
            <div className={classes.detailsText}>{agentCount.unknown} unknown</div>
            {/* <div className={[classes.detailsText, classes.errorText].join(' ')}>{agentCount.alert} alerts</div> */}
          </div>
        </Paper>
        <Paper className={classes.container}>
          <div className={classes.mainNumber} style={{ fontSize: _getMainNumberFontSize(NbOfApps) }}>
            <div>{NbOfApps}</div>
          </div>
          <div className={classes.detailsContainer}>
            <div className={classes.unitType}>Applications</div>
            <div className={classes.detailsText}>{applicationCount.running} running</div>
            <div className={classes.detailsText}>{applicationCount.stopped} stopped</div>
            {/* <div className={[classes.detailsText, classes.errorText].join(' ')}>{applicationCount.error} errors</div> */}
          </div>
        </Paper>
        <Paper className={classes.container}>
          <div className={classes.mainNumber} style={{ fontSize: _getMainNumberFontSize(NbOfMsvcs) }}>
            <div>{NbOfMsvcs}</div>
          </div>
          <div className={classes.detailsContainer}>
            <div className={classes.unitType}>Microservices</div>
            <div className={classes.detailsText}>{microserviceCount.running} running</div>
            <div className={classes.detailsText}>{microserviceCount.stopped} stopped</div>
            <div className={[classes.detailsText, classes.errorText].join(' ')}>{microserviceCount.error} errors</div>
          </div>
        </Paper>
      </div>
    </div>
  )
}
