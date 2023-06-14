import React from 'react'
import { makeStyles } from '@material-ui/styles'
import PublishIcon from '@material-ui/icons/Publish'

import Skeleton from 'react-loading-skeleton'
import { Paper, Table, TableRow, TableCell, TableContainer, TableHead, TableBody, TablePagination, useMediaQuery } from '@material-ui/core'

import MoreIcon from '@material-ui/icons/MoreVert'
import lget from 'lodash/get'
import SearchBar from '../../Utils/SearchBar'
import getSharedStyles from '../../ECNViewer/sharedStyles'
import FileDrop from '../../Utils/FileDrop'
import GetAppIcon from '@material-ui/icons/GetApp'

const useStyles = makeStyles(theme => ({
  ...getSharedStyles(theme),
  pointer: {
    cursor: 'pointer'
  },
  tableActions: {
    padding: '15px',
    display: 'flex',
    justifyContent: 'space-between'
  },
  link: {
    color: theme.palette.text.primary,
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline'
    }
  },
  hiddenInput: {
    width: '0.1px',
    height: '0.1px',
    opacity: 0,
    overflow: 'hidden',
    position: 'absolute',
    zIndex: '-1'
  },
  underlignedBodyCell: {
    borderBottom: `1px solid ${theme.colors.neutral_2}4D !important`
  }
}))

const filterFields = [
  'name',
  'description'
]

export default function CatalogTable (props) {
  const classes = useStyles()
  const { loading, uploading, openMenu, catalog, readCatalogItemFile } = props
  const [filter, setFilter] = React.useState('')
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(5)
  const isLargeScreen = useMediaQuery('(min-width: 992px)')
  const isSmallScreen = useMediaQuery('(min-width: 576px)')

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const filterItem = (item) => {
    for (const field of filterFields) {
      if (lget(item, field, '').toString().toLowerCase().includes(filter)) { return true }
    }
    return false
  }

  const filteredCatalog = catalog.filter(filterItem)
  const dragAndDropContent = (
    <span style={{ fontSize: '14px' }}>
      {isLargeScreen ? 'To add a template, drag a YAML file here or ' : 'Drag or '}
      <label for='file' className={classes.link} style={{ marginRight: '5px', textDecoration: 'underline' }}>upload</label>
    </span>
  )

  // const emptyRows = loading ? 0 : rowsPerPage - Math.min(rowsPerPage, filteredCatalog.length - page * rowsPerPage)
  return (
    <Paper>
      <div className={`${classes.tableActions} ${classes.pointer}`}>
        <SearchBar {...{
          onSearch: setFilter,
          style: {
            marginRight: '15px',
            minWidth: '100px',
            maxWidth: isSmallScreen ? 'inherit' : '200px'
          }
        }}
        />
        {isSmallScreen
          ? (
            <div>
              <FileDrop {...{
                onDrop: readCatalogItemFile,
                onHover: <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}><GetAppIcon style={{ marginRight: '5px' }} /> Release to drop</div>,
                style: { paddingLeft: '5px' },
                loading: uploading
              }}
              >
                <div className={classes.flexColumn}>
                  <input onChange={(e) => readCatalogItemFile(e.target)} type='file' name='files[]' id='file' className={classes.hiddenInput} />
                  <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                    <PublishIcon style={{ marginRight: '5px' }} />
                    {dragAndDropContent}
                  </div>
                </div>
              </FileDrop>
            </div>
          )
          : (

            <FileDrop {...{
              onHover: <GetAppIcon style={{ margin: 'auto' }} />,
              onDrop: readCatalogItemFile,
              loading: uploading,
              style: { padding: 0, height: '39px', minWidth: '39px', position: 'sticky', right: '15px', display: 'flex', justifyContent: 'center' }
            }}
            >
              <>
                <input onChange={(e) => readCatalogItemFile(e.target)} type='file' name='files[]' id='file' className={classes.hiddenInput} />
                <label for='file' style={{ display: 'flex', justifyContent: 'center' }}>
                  <div className={classes.iconContainer} style={{ cursor: 'pointer' }}>
                    <PublishIcon style={{ marginLeft: '-2px' }} />
                  </div>
                </label>
              </>
            </FileDrop>
          )}
      </div>
      <TableContainer>
        <Table className={classes.table} stickyHeader aria-label='simple table'>
          <TableHead>
            <TableRow>
              <TableCell classes={{ stickyHeader: classes.stickyHeaderCell, root: classes.headerCell }}>Name</TableCell>
              <TableCell classes={{ stickyHeader: classes.stickyHeaderCell, root: classes.headerCell }}>Description</TableCell>
              <TableCell classes={{ stickyHeader: classes.stickyHeaderCell, root: classes.headerCell }}>Microservices</TableCell>
              <TableCell classes={{ stickyHeader: classes.stickyHeaderCell, root: classes.headerCell }}>Variables</TableCell>
              <TableCell classes={{ stickyHeader: classes.stickyHeaderCell, root: classes.headerCell }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7}><Skeleton height={50} count={5} /></TableCell></TableRow> : filteredCatalog
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(row => (
                <TableRow key={row.name} hover classes={{ hover: classes.tableRowHover }} style={{ verticalAlign: 'baseline' }}>
                  <TableCell classes={{ root: classes.underlignedBodyCell }} component='th' scope='row' style={{ width: '800px' }}>
                    {row.name}
                  </TableCell>
                  <TableCell classes={{ root: classes.underlignedBodyCell }} style={{ width: '800px' }}>{row.description}</TableCell>
                  <TableCell classes={{ root: classes.underlignedBodyCell }} style={{ width: '800px', whiteSpace: 'pre' }}>{row.display.microservices.join('\n')}</TableCell>
                  <TableCell classes={{ root: classes.underlignedBodyCell }} style={{ width: '800px', whiteSpace: 'pre' }}>{row.display.variables.join('\n')}</TableCell>
                  <TableCell classes={{ root: classes.underlignedBodyCell }} className={classes.pointer} style={{ verticalAlign: 'middle' }}>
                    <MoreIcon onClick={(e) => openMenu(row, e)} />
                  </TableCell>
                </TableRow>
              ))}
            {/* {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )} */}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component='div'
        count={filteredCatalog.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </Paper>
  )
}
