import React from 'react'

import { Divider, TextField, Grid, Button } from '@material-ui/core'
import { FeedbackContext } from '../../../Utils/FeedbackContext'

import { makeStyles } from '@material-ui/styles'
import { ControllerContext } from '../../../ControllerProvider'
const useStyles = makeStyles({
  divider: {
    margin: '5px'
  }
})

const initNode = {
  name: '',
  ip: '',
  key: '',
  port: 54321
}

const newError = (message) => ({ message })

export default function ConnectNode (props) {
  const classes = useStyles()
  const [node, setNode] = React.useState({ ...initNode })
  const { pushFeedback } = React.useContext(FeedbackContext)
  const { request } = React.useContext(ControllerContext)

  const handleChange = key => (event) => {
    setNode({ ...node, [key]: event.target.value })
  }

  const createAgent = async (agent) => {
    const response = await request('/api/v3/iofog', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(agent)
    })
    if (response.ok) {
      pushFeedback({ message: 'ioFog created!', type: 'success' })
      const a = await response.json()
      return a.uuid
    }
    throw (newError(`Failed to create iofog: ${response.statusText}`))
  }

  const getProvisioningKey = async (uuid) => {
    const response = await request(`/api/v3/iofog/${uuid}/provisioning-key`)
    if (response.ok) {
      const a = await response.json()
      return a.key
    }
    throw (newError(`Failed to retrieve provisioning key: ${response.statusText}`))
  }

  const linkAgent = async (agent, controller) => {
    const response = await window.fetch('api/agentApi/v2/config', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: agent.key,
        ioFogApi: `http://${agent.ip}:${agent.port}`
      },
      body: JSON.stringify({ 'controller-url': `http://${controller.ip}:${controller.port}/api/v3/` })
    })
    if (response.ok) {
      pushFeedback({ message: 'Agent linked!', type: 'success' })
      return true
    }
    throw (newError(`Failed to link agent: ${response.statusText}`))
  }

  const provisionAgent = async (agent, key) => {
    const response = await window.fetch('api/agentApi/v2/provision', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: agent.key,
        ioFogApi: `http://${agent.ip}:${agent.port}`
      },
      body: JSON.stringify({ 'provisioning-key': key })
    })
    if (response.ok) {
      pushFeedback({ message: 'Agent provisioned!', type: 'success' })
      return true
    }
    throw (newError(`Failed to provision agent: ${response.statusText}`))
  }

  const connect = async () => {
    try {
      const iofogUuid = await createAgent({ name: node.name, fogType: 0 })
      const provisioningKey = await getProvisioningKey(iofogUuid)
      await linkAgent(node, props.controller)
      await provisionAgent(node, provisioningKey)
      pushFeedback({ message: 'Agent connected!', type: 'success' })
    } catch (e) {
      pushFeedback({ message: e.message, type: 'error', uuid: 'error' })
    }
  }

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            id='name'
            label='Name'
            onChange={handleChange('name')}
            value={node.name}
            fullWidth
            className={classes.textField}
            margin='normal'
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField
            id='ip'
            label='IP'
            onChange={handleChange('ip')}
            value={node.ip}
            fullWidth
            className={classes.textField}
            margin='normal'
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField
            id='port'
            label='Port'
            onChange={handleChange('port')}
            value={node.port}
            fullWidth
            type='number'
            className={classes.textField}
            margin='normal'
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id='key'
            label='Authorization key'
            onChange={handleChange('key')}
            value={node.key}
            fullWidth
            className={classes.textField}
            margin='normal'
            helperText='Authorization key can be found in /etc/iofog-agent/local-api file'
          />
        </Grid>
      </Grid>
      <Divider className={classes.divider} />
      <Grid container justify='flex-end'>
        <Grid item>
          <Button onClick={connect}>
            Connect
          </Button>
        </Grid>
      </Grid>
    </>
  )
}
