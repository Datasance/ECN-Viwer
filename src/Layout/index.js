import React from 'react'
import { HashRouter, Route, Switch, NavLink, Redirect, useLocation } from 'react-router-dom'
import Avatar from '@material-ui/core/Avatar'
import HomeIcon from '@material-ui/icons/HomeOutlined'
import CatalogIcon from '@material-ui/icons/GraphicEqOutlined'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
import AccountBoxIcon from '@material-ui/icons/AccountBox';

import ECNViewer from '../ECNViewer'
import Catalog from '../Catalog'
import Modal from '../Utils/Modal'
import Config from '../Config'
// import ECNViewerConfig from '../ECNViewerConfig'
// import SimpleTabs from '../Utils/Tabs'
import { ControllerContext } from '../ControllerProvider'

import logomark from '../assets/potLogoWithWhiteText.svg'
import './layout.scss'

import { makeStyles } from '@material-ui/styles'
import { MapProvider } from '../providers/Map'
import { useData } from '../providers/Data'
import { useKeycloak } from "@react-keycloak/web";
const controllerJson = window.controllerConfig

const useStyles = makeStyles(theme => ({
  wrapper: {
    color: theme.colors.neutral,
    backgroundColor: 'white'
  },
  divider: {
    margin: '15px 0'
  },
  logo: {
    backgroundColor: theme.colors.datasance_color_0,
    color: theme.colors.white,
  },
  latNav: {
    backgroundColor: theme.colors.datasance_color_0
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
    width: '35px',
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
    color: theme.colors.white,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    fontSize: '9pt',
    '& a': {
      color: theme.colors.white,
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
  const { initialized, keycloak } = useKeycloak()
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

  if(!initialized)
  {
    return (<></>)
  }

  return (
    <>
      <HashRouter>
        <RouteWatcher />
        <div className={classes.wrapper + ' wrapper'}>
          <div className={classes.logo + ' logo'}>
            <NavLink to='/overview' onClick={() => returnHome()}>
              <img src={logomark} style={{marginTop:"1rem"}} width={85} alt='Datasance' />
            </NavLink>
          </div>
          <div className={classes.latNav + ' latnav'}>
            <NavLink to='/overview' onClick={() => returnHome()}>
              <Avatar className={classes.latIcons}>
                <HomeIcon/>
              </Avatar>
            </NavLink>
            <NavLink to='/catalog'>
              <Avatar className={classes.latIcons}>
                <CatalogIcon/>
              </Avatar>
            </NavLink>
            <Avatar className={classes.latIcons}>
              <AccountBoxIcon onClick={() => {window.open(`${controllerJson?.keycloakURL}admin/${controllerJson?.keycloakRealm}/console`,"_blank")}} />
            </Avatar>
            <Avatar className={classes.latIcons}>
              <ExitToAppIcon onClick={() => {keycloak.logout()}} />
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
              <span>Controller v{status?.versions.controller} - ECN Viewer v{status?.versions.ecnViewer}</span>
              <div style={{display:"flex", justifyContent:"space-between", textAlign:"center"}}>
                <div>
                <a style={{ margin: 'auto', fontWeight:"bold" }} target="_blank" href='http://docs.datasance.com'> DOCS</a>
                </div>
              <div>
              <a style={{ margin: 'auto', fontWeight:"bold" }} target="_blank" href='http://api.datasance.com'> API</a>
              </div>
              
              </div>
              <a style={{ margin: 'auto' }} href='https://datasance.com/'>© {new Date().getFullYear()} Datasance.</a>
            </span>
          </div>
        </div>
      </HashRouter>
      
      {/* We removed after keycloak integration*/}
      {/* <Modal
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
      > */}
        {/* <SimpleTabs> */}
        {/* <Config title='User credentials' {...{ onSave: () => setSettingsOpen(false) }} /> */}
        {/* <ECNViewerConfig title='ECN Viewer' {...{ onSave: () => setSettingsOpen(false) }} /> */}
        {/* </SimpleTabs> */}
      {/* </Modal> */}
    </>
  )
}
