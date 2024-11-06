import React from 'react'
import ReactJson from '../../../Utils/ReactJson'
import get from 'lodash/get'

import { Grid, Paper, Typography, TextField, Divider, Select, Input, Button, InputLabel, FormControl, FormControlLabel, Checkbox, MenuItem } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import SwapIcon from '@material-ui/icons/SwapHoriz'

import Autocomplete from '../../../Utils/Autocomplete'

import { makeStyles } from '@material-ui/styles'
import { FeedbackContext } from '../../../Utils/FeedbackContext'
import { ControllerContext } from '../../../ControllerProvider'

const useStyles = makeStyles({
  divider: {
    margin: '5px'
  },
  formControl: {
    width: '100%'
  },
  rowIcon: {
    display: 'flex',
    justifyContent: 'space-around'
  },
  newPaper: {
    border: '1px solid hsla(0, 0%, 0%, 0.2)',
    boxShadow: '0 4px 6px 0 hsla(0,0%,0%,0.2)',
    borderRadius: '4px',
    padding: '10px',
    marginTop: '10px'
  },
  inputWithIcon: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }
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

const initMsvc = {
  flow: {},
  name: '',
  catalog: {
    images: []
  },
  volumeMappings: [],
  ports: [],
  rootHostAccess: false,
  _new: true
}

const initFlow = {
  name: '',
  isActivated: true
}

const initCatalogItem = (fogTypeId) => ({
  name: '',
  images: [{
    containerImage: '',
    fogTypeId
  }],
  registryId: 1
})

const initRoute = (from) => ({
  from,
  to: {}
})

const randomString = () => Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)

const generateRouteSelect = (current, list, label, onChange) => {
  const isNewMsvc = get(current, '_new', false)
  return (
    <Autocomplete
      label={label}
      placeholder='Select a microservice'
      onChange={onChange}
      disabled={isNewMsvc}
      selectedItem={isNewMsvc ? list[list.length - 1] : current}
      maxSuggestions={20}
      suggestions={list.filter(e => !isNewMsvc ? !!e.uuid : true).map(m => ({
        ...m,
        label: m.name
      }))}
    />
  )
}

export default function AddMicroservice (props) {
  const classes = useStyles()
  const [flows, setFlows] = React.useState([])
  const [catalog, setCatalog] = React.useState([])
  // Due to polling, the component is re-rendering every 3 sec.
  // To avoid JSON edit popups to be closed every 3 sec,
  // we need to keep the config and the JSX ReactJson component as ref
  const config = React.useRef({})
  const ReactJsonRef = React.useRef(
    <ReactJson src={config.current} name={false} onAdd={(e) => { config.current = e.updated_src }} onEdit={(e) => { config.current = e.updated_src }} onDelete={(e) => { config.current = e.updated_src }} />
  )
  const [msvc, setMsvc] = React.useState(initMsvc)
  const [newFlow, setNewFlow] = React.useState(initFlow)
  const [newCatalogItem, setNewCatalogItem] = React.useState(() => initCatalogItem(get(props, 'target.fogTypeId', 1)))
  const [routes, setRoutes] = React.useState([])

  const agent = props.target
  const { pushFeedback } = React.useContext(FeedbackContext)
  const { request } = React.useContext(ControllerContext)

  React.useEffect(() => {
    Promise.all([(async () => {
      const flowRaw = await request('/api/v3/flow')
      if (flowRaw.ok) {
        const flowsRes = await flowRaw.json()
        setFlows(flowsRes.flows)
      }
    })(), (async () => {
      const catalogRaw = await request('/api/v3/catalog/microservices')
      if (catalogRaw.ok) {
        const catalogRes = await catalogRaw.json()
        setCatalog(catalogRes.catalogItems.filter(item => {
          for (const img of item.images) {
            if (img.fogTypeId === agent.fogTypeId) { return true }
          }
          return false
        })) // TODO: filter per userId
      }
    })()])
  }, [agent.fogTypeId, request])

  const handleChange = (key, setter, prevState) => e => setter({ ...prevState, [key]: e.target.value })
  const handleMsvcChangeArray = (key, objKey, idx, valueDecorator = x => x) => e => setMsvc({
    ...msvc,
    [key]: [
      ...msvc[key].slice(0, idx),
      {
        ...msvc[key][idx],
        [objKey]: valueDecorator(e.target.value)
      },
      ...msvc[key].slice(idx + 1)
    ]
  })
  const getCatalogImage = item => {
    if (!get(item, 'id', null)) { return 'Select an image' }
    for (const img of item.images) {
      if (img.fogTypeId === agent.fogTypeId) { return img.containerImage }
    }
    return 'Image not found'
  }

  const addVolume = () => setMsvc({
    ...msvc,
    volumeMappings: [
      ...msvc.volumeMappings,
      {
        hostDestination: '',
        containerDestination: '',
        accessMode: 'z'
      }
    ]
  })

  const addPort = () => setMsvc({
    ...msvc,
    ports: [
      ...msvc.ports,
      {
        internal: '',
        external: ''
      }
    ]
  })

  const removeFromArray = (key, idx) => setMsvc({
    ...msvc,
    [key]: [...msvc[key].slice(0, idx), ...msvc[key].slice(idx + 1)]
  })

  const addMsvc = async () => {
    try {
      const { name, ports, volumeMappings, rootHostAccess } = msvc
      const response = await request('/api/v3/microservices', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config: JSON.stringify(config.current),
          name,
          ports,
          volumeMappings,
          rootHostAccess,
          flowId: msvc.flow.id,
          iofogUuid: agent.uuid,
          catalogItemId: msvc.catalog.id
        })
      })
      if (response.ok) {
        pushFeedback({ message: 'Microservice added!', type: 'success' })
        const m = await response.json()
        setMsvc(initMsvc)
        return m.uuid
      } else {
        pushFeedback({ message: response.statusText, type: 'error' })
      }
    } catch (e) {
      pushFeedback({ message: e.message })
    }
  }

  const createFlow = async () => {
    try {
      const { name } = newFlow
      const response = await request('/api/v3/flow', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newFlow)
      })
      if (response.ok) {
        pushFeedback({ message: 'Flow created!', type: 'success' })
        setNewFlow(initFlow)
        const flow = { ...await response.json(), name }
        setMsvc({ ...msvc, flow })
        msvc.flow = flow
        return true
      } else {
        pushFeedback({ message: response.statusText, type: 'error' })
        return false
      }
    } catch (e) {
      pushFeedback({ message: e.message })
      return false
    }
  }

  const createCatalogItem = async () => {
    try {
      const catalogItem = {
        ...newCatalogItem,
        name: randomString()
      }
      const response = await request('/api/v3/catalog/microservices', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(catalogItem)
      })
      if (response.ok) {
        pushFeedback({ message: 'Image added to catalog!', type: 'success' })
        setNewCatalogItem(initCatalogItem(agent.fogTypeId))
        const catalog = { ...await response.json(), ...catalogItem }
        setMsvc({ ...msvc, catalog })
        msvc.catalog = catalog
        return true
      } else {
        pushFeedback({ message: response.statusText, type: 'error' })
        return false
      }
    } catch (e) {
      pushFeedback({ message: e.message })
      return false
    }
  }

  const createRoute = async (route) => {
    try {
      const from = get(route, 'from.uuid')
      const to = get(route, 'to.uuid')
      const response = await request(`/api/v3/microservices/${from}/routes/${to}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: ''
      })
      if (response.ok) {
        pushFeedback({ message: `Route from ${route.from.name} to ${route.to.name} created !`, type: 'success' })
        return true
      } else {
        pushFeedback({ message: response.statusText, type: 'error' })
        return false
      }
    } catch (e) {
      pushFeedback({ message: e.message })
      return false
    }
  }

  const createRoutes = async (defaultUuid) => {
    for (const route of routes) {
      if (!route.from.uuid) {
        route.from.uuid = defaultUuid
      }
      if (!route.to.uuid) {
        route.to.uuid = defaultUuid
      }
      await createRoute(route)
    }
  }

  const createMsvc = async () => {
    let success = true
    try {
      if (msvc.flow.id === -1) {
        success = await createFlow()
      }
      if (success && msvc.catalog.id === -1) {
        success = await createCatalogItem()
      }
      if (success) {
        const uuid = await addMsvc()
        await createRoutes(uuid)
        props.onSuccess()
      }
    } catch (e) {

    }
  }

  const routeList = (props.microservices || [])
    .map(m => ({
      ...m,
      label: m.name
    }))
    .concat([{
      ...msvc,
      label: msvc.name ? msvc.name : '<New microservice>'
    }])

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl className={classes.formControl}>
            <Autocomplete
              label='Flow'
              placeholder='Select a flow'
              onChange={(selected, state) => {
                handleChange('flow', setMsvc, msvc)({ target: { value: selected || {} } })
              }}
              maxSuggestions={20}
              suggestions={flows.map(f => ({
                ...f,
                label: f.name
              })).concat([{
                id: -1,
                label: '+ Add a flow'
              }])}
            />
          </FormControl>
          {msvc.flow.id === -1 &&
            <Paper className={classes.newPaper}>
              <Typography variant='subtitle2'>New flow</Typography>
              <TextField
                id='name'
                label='Name'
                required
                onChange={handleChange('name', setNewFlow, newFlow)}
                value={newFlow.name}
                fullWidth
                className={classes.textField}
                margin='normal'
              />
              <FormControlLabel
                style={{ color: 'rgba(0, 0, 0, 0.54)' }}
                control={
                  <Checkbox
                    checked={newFlow.isActivated}
                    onChange={e => setNewFlow({ ...newFlow, isActivated: e.target.checked })}
                    value='checkedB'
                    color='primary'
                  />
                }
                label='Active'
              />
            </Paper>}
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl className={classes.formControl}>
            <Autocomplete
              label='Image'
              placeholder='Select an image'
              onChange={(selected, state) => {
                handleChange('catalog', setMsvc, msvc)({ target: { value: selected || {} } })
              }}
              maxSuggestions={20}
              suggestions={catalog.map(m => ({
                ...m,
                label: getCatalogImage(m)
              })).concat([{
                id: -1,
                label: '+ Add an image'
              }])}
            />
          </FormControl>
          {msvc.catalog.id === -1 &&
            <Paper className={classes.newPaper}>
              <Typography variant='subtitle2'>New image</Typography>
              <TextField
                id='name'
                label='Name'
                required
                onChange={e => setNewCatalogItem({
                  ...newCatalogItem,
                  images: [{
                    ...newCatalogItem.images[0],
                    containerImage: e.target.value
                  }]
                })}
                value={newCatalogItem.images[0].containerImage}
                fullWidth
                className={classes.textField}
                margin='normal'
              />
            </Paper>}
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            id='name'
            label='Name'
            required
            onChange={handleChange('name', setMsvc, msvc)}
            value={msvc.name}
            fullWidth
            className={classes.textField}
            margin='normal'
          />
        </Grid>
      </Grid>
      <Divider className={classes.divider} />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography style={{ color: 'rgba(0, 0, 0, 0.54)' }} variant='subtitle1'>Configuration</Typography><br />
          {ReactJsonRef.current}
        </Grid>
      </Grid>
      <Divider className={classes.divider} />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography style={{ color: 'rgba(0, 0, 0, 0.54)' }} variant='subtitle1'>Volumes</Typography><br />
          {msvc.volumeMappings.map((v, idx) =>
            <Grid container spacing={2} key={idx} style={{ alignItems: 'flex-end' }}>
              <Grid item xs={11}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      id='host'
                      label='Host'
                      required
                      onChange={handleMsvcChangeArray('volumeMappings', 'hostDestination', idx)}
                      value={v.hostDestination}
                      fullWidth
                      className={classes.textField}
                      margin='dense'
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      id='Container'
                      label='Container'
                      required
                      onChange={handleMsvcChangeArray('volumeMappings', 'containerDestination', idx)}
                      value={v.containerDestination}
                      fullWidth
                      className={classes.textField}
                      margin='dense'
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl className={classes.formControl} style={{ marginTop: '5px' }}>
                      <InputLabel htmlFor='select-flow'>Access mode</InputLabel>
                      <Select
                        required
                        value={v.accessMode}
                        onChange={handleMsvcChangeArray('volumeMappings', 'accessMode', idx)}
                        input={<Input id='select-flow-input' />}
                        MenuProps={MenuProps}
                      >
                        <MenuItem value='z'>Z</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={1} className={classes.rowIcon}>
                <CloseIcon style={{ cursor: 'pointer' }} onClick={() => removeFromArray('volumeMappings', idx)} />
              </Grid>
            </Grid>
          )}
          <Typography style={{ color: 'rgba(0, 0, 0, 0.54)', cursor: 'pointer' }} variant='caption' onClick={() => addVolume()}>+ Add</Typography>
        </Grid>
      </Grid>
      <Divider className={classes.divider} />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography style={{ color: 'rgba(0, 0, 0, 0.54)' }} variant='subtitle1'>Ports</Typography><br />
          {msvc.ports.map((p, idx) =>
            <Grid container spacing={2} key={idx} style={{ alignItems: 'flex-end' }}>
              <Grid item xs={11}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      id='host'
                      label='External'
                      required
                      type='number'
                      onChange={handleMsvcChangeArray('ports', 'external', idx, parseInt)}
                      value={p.external}
                      fullWidth
                      className={classes.textField}
                      margin='dense'
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      id='Container'
                      label='Internal'
                      required
                      fullWidth
                      type='number'
                      onChange={handleMsvcChangeArray('ports', 'internal', idx, parseInt)}
                      value={p.internal}
                      className={classes.textField}
                      margin='dense'
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={1} className={classes.rowIcon}>
                <CloseIcon style={{ cursor: 'pointer' }} onClick={() => removeFromArray('ports', idx)} />
              </Grid>
            </Grid>
          )}
          <Typography style={{ color: 'rgba(0, 0, 0, 0.54)', cursor: 'pointer' }} variant='caption' onClick={() => addPort()}>+ Add</Typography>
        </Grid>
      </Grid>
      <Divider className={classes.divider} />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography style={{ color: 'rgba(0, 0, 0, 0.54)' }} variant='subtitle1'>Routes</Typography><br />
          {routes.map((r, idx) =>
            <Grid container spacing={2} key={idx} style={{ alignItems: 'flex-end' }}>
              <Grid item xs={11}>
                <Grid container spacing={2} style={{ alignItems: 'flex-end' }}>
                  <Grid item xs={12} sm={5}>
                    {generateRouteSelect(r.from, routeList, 'From', selected => setRoutes([
                      ...routes.slice(0, idx),
                      {
                        ...r,
                        from: selected || {}
                      },
                      ...routes.slice(idx + 1)
                    ]))}
                  </Grid>
                  <Grid item xs={2} className={classes.rowIcon}>
                    <SwapIcon
                      style={{ cursor: 'pointer' }} onClick={() => setRoutes([
                        ...routes.slice(0, idx),
                        {
                          ...r,
                          from: r.to,
                          to: r.from
                        },
                        ...routes.slice(idx + 1)
                      ])}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    {generateRouteSelect(r.to, routeList, 'To', selected => setRoutes([
                      ...routes.slice(0, idx),
                      {
                        ...r,
                        to: selected || {}
                      },
                      ...routes.slice(idx + 1)
                    ]))}
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={1} className={classes.rowIcon}>
                <CloseIcon style={{ cursor: 'pointer' }} onClick={() => setRoutes([...routes.slice(0, idx), ...routes.slice(idx + 1)])} />
              </Grid>
            </Grid>
          )}
          <Typography style={{ color: 'rgba(0, 0, 0, 0.54)', cursor: 'pointer' }} variant='caption' onClick={() => setRoutes([...routes, initRoute(msvc)])}>+ Add</Typography>
        </Grid>
      </Grid>
      <Divider className={classes.divider} />
      <FormControlLabel
        style={{ color: 'rgba(0, 0, 0, 0.54)' }}
        control={
          <Checkbox
            checked={msvc.rootHostAccess}
            onChange={e => setMsvc({ ...msvc, rootHostAccess: e.target.checked })}
            value='checkedB'
            color='primary'
          />
        }
        label='Root host access'
      />
      <Divider className={classes.divider} />
      <Grid container justify='flex-end'>
        <Grid item>
          <Button onClick={createMsvc}>
            Add
          </Button>
        </Grid>
      </Grid>
    </>
  )
}
