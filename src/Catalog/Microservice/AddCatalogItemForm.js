import React from 'react'
import { makeStyles } from '@material-ui/styles'

import Skeleton from 'react-loading-skeleton'
import { TextField, Grid, Button, MenuItem } from '@material-ui/core'

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
export default function AddCatalogItemForm (props) {
  const classes = useStyles()
  const [newItem, setNewItem] = React.useState({
    images: {
      x86: '',
      arm: ''
    },
    registryId: 1,
    name: '',
    description: '',
    category: '',
    ...props.newCatalogItem
  })
  const { onSave, loading, registries } = props
  const handleChange = (key) => (e) => setNewItem({ ...newItem, [key]: e.target.value })
  const handleImageChange = (key) => (e) => setNewItem({ ...newItem, images: { ...newItem.images, [key]: e.target.value } })
  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            id='name'
            label='Name'
            onChange={handleChange('name')}
            value={newItem.name}
            fullWidth
            className={classes.textField}
            margin='normal'
            variant='outlined'
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id='description'
            label='Description'
            onChange={handleChange('description')}
            value={newItem.description}
            fullWidth
            multiline
            rowsMax='4'
            className={classes.textField}
            margin='normal'
            variant='outlined'
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id='x86'
            label='x86'
            helperText='image to be used on x86 edge nodes'
            onChange={handleImageChange('x86')}
            value={newItem.images.x86}
            fullWidth
            className={classes.textField}
            margin='normal'
            variant='outlined'
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id='arm'
            label='ARM'
            helperText='image to be used on ARM edge nodes'
            onChange={handleImageChange('arm')}
            value={newItem.images.arm}
            fullWidth
            className={classes.textField}
            margin='normal'
            variant='outlined'
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id='registry'
            select
            label='Registry'
            fullWidth
            className={classes.textField}
            value={newItem.registryId}
            onChange={handleChange('registryId')}
            variant='outlined'
            InputProps={{
              style: { marginTop: '16px' }
            }}
            InputLabelProps={{
              style: { marginTop: '16px' }
            }}
          >
            {registries.map(option => (
              <MenuItem key={option.id} value={option.id}>
                {option.url}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id='category'
            label='Category'
            onChange={handleChange('category')}
            value={newItem.category}
            fullWidth
            multiline
            rowsMax='4'
            className={classes.textField}
            margin='normal'
            variant='outlined'
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id='publisher'
            label='Publisher'
            onChange={handleChange('publisher')}
            value={newItem.publisher}
            fullWidth
            multiline
            rowsMax='4'
            className={classes.textField}
            margin='normal'
            variant='outlined'
          />
        </Grid>
      </Grid>
      <Grid container justify='flex-end'>
        <Grid item>
          <Button onClick={() => onSave(newItem)}>
            {loading ? <Skeleton> </Skeleton> : 'Save'}
          </Button>
        </Grid>
      </Grid>
    </>
  )
}
