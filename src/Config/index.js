import React from 'react'
import { TextField, Grid, Button, InputAdornment, Divider, useMediaQuery, Tabs, Tab } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'

import { ControllerContext } from '../ControllerProvider'
import { FeedbackContext } from '../Utils/FeedbackContext'
import { useConfig } from '../providers/Config'

const useStyles = makeStyles((theme) => ({
  skeleton: {
    minHeight: '55px'
  },
  wrapper: {
    fontSize: '17px',
    fontWeight: '700',
    color: theme.colors.neutral,
    '&::after': {
      content: ''
    }
  },
  textColorInherit: {
    opacity: '.51'
  },
  selectedTab: {
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
    borderBottom: '4px solid'
  },
  tabContainer: {
    paddingTop: '15px',
    paddingLeft: '15px',
    paddingRight: '15px',
    // border: '1px solid',
    borderRadius: '4px',
    marginBottom: '15px'
  }
}))

export default function Config (props) {
  const classes = useStyles()
  const { pushFeedback } = React.useContext(FeedbackContext)
  const { user, refresh, updateController, location } = React.useContext(ControllerContext)
  const { config, saveConfig } = useConfig()
  const [data, setData] = React.useState({ user, refresh })
  const [lat, setLat] = React.useState(config.controllerLocationInfo ? config.controllerLocationInfo.lat : location.lat)
  const [lon, setLon] = React.useState(config.controllerLocationInfo ? config.controllerLocationInfo.lon : location.lon)
  const isLargeScreen = useMediaQuery('(min-width: 992px)')
  const [tabValue, setTabValue] = React.useState(0)

  const padding = isLargeScreen ? 10 : 25
  const save = async () => {
    try {
      await updateController(data)
      await saveConfig({
        ...config,
        controllerLocationInfo: {
          lat, lon
        }
      })
      pushFeedback({ message: 'Authenticated!', type: 'success' })
      props.onSave()
    } catch (e) {
      pushFeedback({ message: e.message, type: 'error' })
    }
  }

  const handleChange = name => event => {
    setData({ ...data, [name]: event.target.value })
  }
  const handleUserChange = name => event => {
    setData({ ...data, user: { ...data.user, [name]: event.target.value } })
  }

  const tabs = [
    {
      id: 'user',
      title: 'User',
      render: () => (
        <Grid container spacing={2} style={{ paddingBottom: (padding + 5) + 'px' }}>
          <Grid item xs={12} lg={6}>
            <TextField
              id='email'
              label='Email'
              onChange={handleUserChange('email')}
              value={data.user.email}
              fullWidth
              className={classes.textField}
              margin='normal'
              variant='outlined'
            />
          </Grid>
          <Grid item xs={12} lg={6}>
            <TextField
              id='password'
              label='Password'
              onChange={handleUserChange('password')}
              onKeyPress={(e) => e.key === 'Enter' && data.user.email && data.user.password ? save() : null}
              value={data.user.password}
              fullWidth
              type='password'
              className={classes.textField}
              margin='normal'
              variant='outlined'
            />
          </Grid>
        </Grid>
      )
    },
    {
      id: 'config',
      title: 'Controller',
      render: () => (
        <>
          <Grid container spacing={2} style={{ paddingBottom: padding + 'px' }}>
            <Grid item xs={12} lg={6}>
              <TextField
                id='lat'
                label='Latitude'
                onChange={e => setLat(e.target.value)}
                value={lat}
                fullWidth
                className={classes.textField}
                margin='normal'
                type='number'
                variant='outlined'
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <TextField
                id='lon'
                label='Longitude'
                onChange={e => setLon(e.target.value)}
                value={lon}
                fullWidth
                className={classes.textField}
                margin='normal'
                type='number'
                variant='outlined'
              />
            </Grid>
          </Grid>
          <Divider />
          <Grid container spacing={2} style={{ paddingTop: padding + 'px', paddingBottom: padding + 'px' }}>
            <Grid item xs={12} lg={6}>
              <TextField
                id='refresh'
                label='Update Frequency'
                type='number'
                onChange={handleChange('refresh')}
                value={data.refresh}
                fullWidth
                className={classes.textField}
                margin='normal'
                variant='outlined'
                inputProps={{
                  min: '1000',
                  step: '500'
                }}
                InputProps={{
                  endAdornment: <InputAdornment position='end'>ms</InputAdornment>
                }}
              />
            </Grid>
          </Grid>
        </>
      )
    }
  ]

  return (
    <>
      <Tabs
        value={tabValue}
        TabIndicatorProps={{ hidden: true }}
        onChange={(e, value) => setTabValue(value)}
        aria-labelledby={tabs.map((c, idx) => c.id || idx).join(' ')}
        style={{ flex: '2 1 0px', position: 'sticky', left: 0 }}
      >
        {tabs.map((child, idx) => {
          return (
            child && <Tab key={child.id || idx} classes={{ wrapper: classes.wrapper, selected: classes.selectedTab, textColorInherit: classes.textColorInherit }} id={child.id || idx} label={child.title} />
          )
        })}
      </Tabs>
      <div className={classes.tabContainer}>
        {tabs[tabValue].render()}
      </div>
      <Grid container justify='flex-end'>
        <Grid item>
          <Button onClick={save}>
            Save
          </Button>
        </Grid>
      </Grid>
    </>
  )
}
