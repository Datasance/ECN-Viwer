import { FormControl, FormHelperText, makeStyles, TextField, Button, InputLabel, Select, MenuItem } from '@material-ui/core'
import React from 'react'
import { useController } from '../../ControllerProvider'
import { useFeedback } from '../../Utils/FeedbackContext'
import { useData } from '../../providers/Data'
import Status from '../../Utils/Status'
import lget from 'lodash/get'

const useStyles = makeStyles(theme => ({
  variableSection: {
    marginBottom: '40px',
    width: '100%'
  },
  input: {
    width: '100%'
  },
  container: {
    paddingTop: '20px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  wrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  buttonContainer: {
    width: '100%',
    textAlign: 'right'
  },
  select: {
    display: 'flex'
  },
  formControl: {
    width: '100%'
  }
}))

const mapVariables = (template) => {
  const variables = template.variables || []
  const agentVariables = template.application.microservices.map(m => {
    const agentName = lget(m, 'agentName', '')
    if (agentName.startsWith('{{')) { // variable
      return agentName.slice(2, agentName.length - 2).trim()
    } else {
      return ''
    }
  }).filter(v => v)
  return variables.reduce((acc, v) => {
    acc[v.key] = {
      value: v.defaultValue !== undefined && v.defaultValue !== null ? JSON.parse(v.defaultValue) : '',
      description: v.description,
      key: v.key
    }
    // Check if agent
    if (agentVariables.includes(v.key)) {
      acc[v.key].isAgentName = true
      acc[v.key].value = ''
      return acc
    }

    // Input type infering
    if (acc[v.key].value !== undefined) {
      acc[v.key].type = typeof acc[v.key].value

      if (acc[v.key].type === 'string') {
        acc[v.key].type = 'text'
      }
      if (acc[v.key].type === 'number') {
        acc[v.key].value = acc[v.key].value || 0
      }
    } else {
      acc[v.key].type = 'text'
    }
    if (acc[v.key].type !== 'text' && acc[v.key].type !== 'number') {
      acc[v.key].readOnly = true
    }
    return acc
  }, {})
}

export default function DeployApplicationTemplate ({ template, close }) {
  const [variables, setVariables] = React.useState(mapVariables(template))
  const [applicationName, setApplicationName] = React.useState('')
  const { pushFeedback } = useFeedback()
  const { request } = useController()
  const { data } = useData()
  const [loading, setLoading] = React.useState(false)
  const classes = useStyles()

  const handleChange = (key, value) => {
    // Convert variables if needed (All values are received as string)
    if (variables[key].type === 'number') {
      value = +value
    }
    setVariables(v => ({
      ...v,
      [key]: {
        ...v[key],
        value
      }
    }))
  }

  const deployApplication = async () => {
    if (!applicationName) {
      pushFeedback({ message: 'Application name is required', type: 'error' })
      return
    }
    const newApplication = !data.applications.find(a => a.name === applicationName)
    const url = `/api/v3/application${newApplication ? '' : `/${applicationName}`}`
    try {
      setLoading(true)
      const res = await request(url, {
        method: newApplication ? 'POST' : 'PUT',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          name: applicationName,
          isActivated: true,
          template: {
            name: template.name,
            variables: Object.keys(variables).map(key => {
              return {
                key,
                value: variables[key].value
              }
            })
          }
        })
      })
      if (!res.ok) {
        try {
          const error = await res.json()
          pushFeedback({ message: error.message, type: 'error' })
        } catch (e) {
          pushFeedback({ message: res.statusText, type: 'error' })
        }
        setLoading(false)
      } else {
        pushFeedback({ message: 'Application deployed!', type: 'success' })
        setLoading(false)
        close()
      }
    } catch (e) {
      setLoading(false)
      pushFeedback({ message: e.message, type: 'error' })
    }
  }

  return (
    <div className={classes.container}>
      <div className={classes.wrapper}>
        <div className={classes.variableSection}>
          <FormControl className={classes.formControl}>
            <TextField
              className={classes.input}
              variant='outlined'
              label='Application Name'
              value={applicationName}
              onChange={e => setApplicationName(e.target.value)}
            />
          </FormControl>
        </div>
        {Object.keys(variables).map(key => {
          const v = variables[key]
          return (
            v.readOnly
              ? (
                <div className={classes.variableSection} style={{ width: '400px' }} key={key}>
                  <div>Variable <strong>{key}</strong> is not configurable using ECN Viewer</div>
                  <div>Default value is <strong>{JSON.stringify(v.defaultValue)}</strong></div>
                </div>
              )
              : (v.isAgentName
                ? (
                  <div className={classes.variableSection} key={key}>
                    <FormControl className={classes.formControl} variant='outlined'>
                      <InputLabel id='demo-simple-select-outlined-label'>{key}</InputLabel>
                      <Select
                        value={v.value}
                        onChange={e => handleChange(key, e.target.value)}
                        label={key}
                        style={{ width: '100%' }}
                        classes={{
                          select: classes.select
                        }}
                      >
                        {data.controller.agents.map(a => <MenuItem key={a.uuid} value={a.name}><Status status={a.daemonStatus} style={{ marginRight: '15px' }} />{a.name}</MenuItem>)}
                      </Select>
                      <FormHelperText>{v.description}</FormHelperText>
                    </FormControl>
                  </div>
                )
                : (
                  <div className={classes.variableSection} key={key}>
                    <FormControl className={classes.formControl}>
                      <TextField
                        className={classes.input}
                        variant='outlined'
                        label={key}
                        value={v.value}
                        type={v.type}
                        onChange={e => handleChange(key, e.target.value)}
                      />
                      <FormHelperText>{v.description}</FormHelperText>
                    </FormControl>
                  </div>
                )))
        })}
        <div className={classes.buttonContainer}>
          <Button style={{ marginRight: '15px' }} onClick={close}>Cancel</Button>
          {loading
            ? <Button variant='contained' disabled color='primary'>Deploy</Button>
            : <Button variant='contained' color='primary' onClick={() => deployApplication(variables, template)}>Deploy</Button>}
        </div>
      </div>
    </div>
  )
}
