import React from 'react'
import { HashRouter, Route, Switch, NavLink, Redirect, useLocation } from 'react-router-dom'
import Avatar from '@material-ui/core/Avatar'
import HomeIcon from '@material-ui/icons/HomeOutlined'
import CatalogIcon from '@material-ui/icons/GraphicEqOutlined'
import SettingsIcon from '@material-ui/icons/SettingsOutlined'

import ECNViewer from '../ECNViewer'
import Catalog from '../Catalog'
import Modal from '../Utils/Modal'
import Config from '../Config'
// import ECNViewerConfig from '../ECNViewerConfig'
// import SimpleTabs from '../Utils/Tabs'
import { ControllerContext } from '../ControllerProvider'

import logomark from '../assets/logomark.svg'
import './layout.scss'

import { makeStyles } from '@material-ui/styles'
import { MapProvider } from '../providers/Map'
import { useData } from '../providers/Data'

const useStyles = makeStyles(theme => ({
  wrapper: {
    color: theme.colors.neutral,
    backgroundColor: 'white'
  },
  divider: {
    margin: '15px 0'
  },
  logo: {
    backgroundColor: theme.colors.purple,
    color: theme.colors.white
  },
  latNav: {
    backgroundColor: theme.colors.carbon
  },
  latIcons: {
    margin: 'auto',
    marginTop: '15px',
    cursor: 'pointer',
    backgroundColor: theme.colors.carbon,
    '.active &': {
      backgroundColor: '#0E445C'
    }
  },
  topIcons: {
    height: '100%',
    width: '25px',
    marginRight: '25px',
    cursor: 'pointer'
  },
  nav: {
    marginBottom: '15px',
    height: '50px',
    '& a': {
      height: '100%',
      '& img': {
        height: '100%'
      }
    }
  },
  footerContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    justifyItems: 'center',
    padding: '20px 10px 20px 0px'
  },
  footer: {
    color: theme.colors.neutral,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    fontSize: '9pt',
    '& a': {
      color: theme.colors.neutral,
      textDecoration: 'none!important'
    }
  }
}))

function RouteWatcher ({ children }) {
  const { refreshData } = useData()
  const location = useLocation()

  React.useEffect(() => {
    if (location.pathname === '/overview') {
      console.log('Refreshing data')
      refreshData()
    }
  }, [location])

  return null
}

export default function Layout () {
  const classes = useStyles()
  const returnHomeCbRef = React.useRef(null)
  const { user, status } = React.useContext(ControllerContext)
  const [settingsOpen, setSettingsOpen] = React.useState(!(user.email && user.password))

  console.log(' ====> Rendering layout')

  const returnHome = () => {
    if (returnHomeCbRef.current) {
      returnHomeCbRef.current()
    }
  }

  return (
    <>
      <HashRouter>
        <RouteWatcher />
        <div className={classes.wrapper + ' wrapper'}>
          <div className={classes.logo + ' logo'}>
            <NavLink to='/overview' onClick={() => returnHome()}>
              <img src={logomark} alt='Edgeworx logomark' />
            </NavLink>
          </div>
          <div className={classes.latNav + ' latnav'}>
            <NavLink to='/overview' onClick={() => returnHome()}>
              <Avatar className={classes.latIcons}>
                <HomeIcon />
              </Avatar>
            </NavLink>
            <NavLink to='/catalog'>
              <Avatar className={classes.latIcons}>
                <CatalogIcon />
              </Avatar>
            </NavLink>
            <Avatar className={classes.latIcons}>
              <SettingsIcon onClick={() => setSettingsOpen(v => !v)} />
            </Avatar>
          </div>
          <div className='content'>
            <Switch>
              <Route path='/catalog' component={Catalog} />
              <Route path='/overview' component={() => <MapProvider><ECNViewer returnHomeCBRef={returnHomeCbRef} /></MapProvider>} />
              <Route component={() => <Redirect to='/overview' />} />
            </Switch>
          </div>
          <div className={`${classes.footerContainer} footer`}>
            <span className={classes.footer}>
              <span>Controller v{status.versions.controller} - ECN Viewer v{status.versions.ecnViewer}</span>
              <a style={{ margin: 'auto' }} href='http://www.eclipse.org/legal/copyright.php'>© {new Date().getFullYear()} Eclipse Foundation, Inc.</a>
            </span>
          </div>
        </div>
      </HashRouter>
      <Modal
        {...{
          open: settingsOpen,
          title: 'Configuration',
          onClose: () => setSettingsOpen(false),
          style: {
            modalContent: {
              paddingTop: 0
            }
          }
        }}
      >
        {/* <SimpleTabs> */}
        <Config title='User credentials' {...{ onSave: () => setSettingsOpen(false) }} />
        {/* <ECNViewerConfig title='ECN Viewer' {...{ onSave: () => setSettingsOpen(false) }} /> */}
        {/* </SimpleTabs> */}
      </Modal>
    </>
  )
}
