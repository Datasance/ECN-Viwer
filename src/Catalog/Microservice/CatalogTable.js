import React from 'react'
import { makeStyles } from '@material-ui/styles'

import Skeleton from 'react-loading-skeleton'
import { Paper, Table, TableRow, TableCell, TableContainer, TableHead, TableBody, TablePagination } from '@material-ui/core'

import MoreIcon from '@material-ui/icons/MoreVert'
import lget from 'lodash/get'
import SearchBar from '../../Utils/SearchBar'

const useStyles = makeStyles(theme => ({
  pointer: {
    cursor: 'pointer'
  },
  tableActions: {
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between'
  }
}))

const filterFields = [
  'name',
  'description',
  'publisher',
  'supportedPlatforms',
  'category',
  'registry.url'
]

export default function CatalogTable (props) {
  const classes = useStyles()
  const { loading, openMenu, catalog } = props
  const [filter, setFilter] = React.useState('')
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(5)

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

  const emptyRows = loading ? 0 : rowsPerPage - Math.min(rowsPerPage, filteredCatalog.length - page * rowsPerPage)
  return (
    <>
      <div className={`${classes.tableActions} ${classes.pointer}`}>
        <SearchBar
          {...{
            onSearch: setFilter
          }}
        />
      </div>
      <TableContainer component={Paper}>
        <Table className={classes.table} stickyHeader aria-label='simple table'>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell >Description</TableCell>
              <TableCell >Supported platforms</TableCell>
              <TableCell >Publisher</TableCell>
              <TableCell >Registry</TableCell>
              <TableCell >Category</TableCell>
              <TableCell  />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7}><Skeleton height={50} count={5} /></TableCell></TableRow> : filteredCatalog
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(row => (
                <TableRow key={row.name}>
                  <TableCell component='th' scope='row'>
                    {row.name}
                  </TableCell>
                  <TableCell >{row.description}</TableCell>
                  <TableCell >{row.supportedPlatforms.join(', ')}</TableCell>
                  <TableCell >{row.publisher}</TableCell>
                  <TableCell >{row.registry.url}</TableCell>
                  <TableCell >{row.category}</TableCell>
                  <TableCell  className={classes.pointer}>
                    <MoreIcon onClick={(e) => openMenu(row, e)} />
                  </TableCell>
                </TableRow>
              ))}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )}
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
    </>
  )
}
