import React from 'react'

import { FormControl, Divider, Grid, Button, Input, InputLabel, Select, MenuItem, Checkbox, ListItemText, Chip } from '@material-ui/core'

import { makeStyles } from '@material-ui/styles'
import { FeedbackContext } from '../../../Utils/FeedbackContext'
import { ControllerContext } from '../../../ControllerProvider'
const useStyles = makeStyles({
  chips: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  chip: {
    margin: 2
  },
  formControl: {
    width: '100%',
    marginBottom: '15px'
  },
  divider: {
    margin: '5px'
  }
})

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250
    }
  }
}

export default function RemoveMicroservice (props) {
  const classes = useStyles()
  const [msvcsToRemove, setMsvcsToRemove] = React.useState([])
  const { pushFeedback } = React.useContext(FeedbackContext)
  const { request } = React.useContext(ControllerContext)

  function handleChange (event) {
    setMsvcsToRemove(event.target.value)
  }

  const remove = async () => {
    try {
      let success = true
      for (const uuid of msvcsToRemove) {
        const res = request(`/api/v1/microservices/${uuid}`, {
          method: 'DELETE'
        })
        if (!res.ok) {
          success = false
          pushFeedback({ message: `${msvcsPerUUID[uuid].name}: ${res.statusText}`, type: 'error', uuid })
        } else {
          const idx = msvcsToRemove.indexOf(uuid)
          setMsvcsToRemove([...msvcsToRemove.slice(0, idx), ...msvcsToRemove.slice(idx + 1)])
        }
      }
      if (success) {
        pushFeedback({ message: 'Microservices removed', type: 'success', uuid: 'success' })
        props.onSuccess()
      }
    } catch (e) {
      pushFeedback({ message: e.message, type: 'error', uuid: 'error' })
    }
  }

  const { msvcs } = props

  const msvcsPerUUID = msvcs.reduce((r, m) => ({
    ...r,
    [m.uuid]: m
  }), {})

  return (
    <>
      <FormControl className={classes.formControl}>
        <InputLabel htmlFor='select-multiple-checkbox'>Microservices to remove</InputLabel>
        <Select
          multiple
          value={msvcsToRemove}
          onChange={handleChange}
          input={<Input id='select-multiple-checkbox-rm-msvcs' />}
          renderValue={selected => (
            <div className={classes.chips}>
              {selected.map(uuid => (
                msvcsPerUUID[uuid] && <Chip key={uuid} label={msvcsPerUUID[uuid].name} className={classes.chip} />
              ))}
            </div>
          )}
          MenuProps={MenuProps}
        >
          {msvcs.map(m => (
            <MenuItem key={m.uuid} value={m.uuid}>
              <Checkbox checked={msvcsToRemove.indexOf(m.uuid) > -1} />
              <ListItemText primary={m.name} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Divider className={classes.divider} />
      <Grid container justify='flex-end'>
        <Grid item>
          <Button onClick={remove}>
            Remove
          </Button>
        </Grid>
      </Grid>
    </>
  )
}
