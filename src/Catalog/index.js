import React from 'react'

import ApplicationCatalog from './Application'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles(theme => ({
  title: {
    height: '60px',
    textTransform: 'uppercase',
    fontSize: '20px',
    fontWeight: 'bold',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingLeft: '30px'
  }
}))

export default function Catalog () {
  const classes = useStyles()

  return (
    <>
      <div className={classes.title}>Application template catalog</div>
      <ApplicationCatalog title='Applications' />
    </>
  )
}
