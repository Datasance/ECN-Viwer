import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import Typography from '@material-ui/core/Typography'
import SearchBar from './SearchBar'

function TabContainer (props) {
  return (
    <Typography component='div'>
      {props.children}
    </Typography>
  )
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired
}

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
    // height: '100%',
    width: 'max-content',
    minWidth: '100%',
    '& .MuiTabs-scroller': {
      paddingLeft: '15px'
    },
    '@media (min-width: 600px)': {
      '& .MuiTab-root': {
        minWidth: 'unset'
      }
    },
    position: 'relative'
  },
  tabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 15px 15px 0px'
  },
  sticky: {
    position: 'sticky',
    top: 0,
    left: 0,
    width: '100%',
    backgroundColor: 'white',
    zIndex: 2
  },
  wrapper: {
    fontSize: '17px',
    fontWeight: '700',
    color: theme.colors.datasance_color_0
  },
  textColorInherit: {
    opacity: '.51'
  }
}))

export default function SimpleTabs (props) {
  const classes = useStyles()
  const [value, setValue] = React.useState(0)

  function handleChange (event, newValue) {
    setValue(newValue)
  }

  const children = props.children.filter(c => !!c)
  const headerClasses = [classes.tabHeader]
  if (props.stickyHeader) {
    headerClasses.push(classes.sticky)
  }

  return (
    <div className={classes.root}>
      {
        children.length === 1
          ? children
          : (
            <>
              <div className={headerClasses.join(' ')}>
                <Tabs
                  value={value}
                  TabIndicatorProps={{ hidden: true }}
                  onChange={handleChange}
                  aria-labelledby={children.map((c, idx) => c.id || idx).join(' ')}
                  style={{ flex: '1 1 0px', position: 'sticky', left: 0 }}
                >
                  {children.map((child, idx) => {
                    return (
                      child && <Tab key={child.id || idx} classes={{ wrapper: classes.wrapper, textColorInherit: classes.textColorInherit }} id={child.id || idx} label={child.props.title} />
                    )
                  })}
                </Tabs>
                {props.headers && props.headers(value)}
                {props.onSearch && <SearchBar onSearch={props.onSearch} style={{ marginRight: '5px' }} />}
              </div>
              {props.children[value]}
            </>)
      }
    </div>
  )
}
