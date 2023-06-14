import React from 'react'
import { findIndex } from 'lodash'
import Alert from './Alert'

export const FeedbackContext = React.createContext({
  feedbacks: [],
  setFeedbacks: () => {},
  pushFeedback: () => {}
})

export const useFeedback = () => React.useContext(FeedbackContext)

const AUTO_HIDE = 6000

const actions = {
  ADD: 'add',
  REMOVE: 'remove',
  SET: 'set'
}

const initState = {
  feedbacks: [],
  nextId: 0
}

const reducer = (state, action) => {
  switch (action.type) {
    case actions.ADD:
      return {
        feedbacks: [...state.feedbacks,
          {
            ...action.data,
            timeout: setTimeout(() => {
              action.dispatch({ type: actions.REMOVE, data: { id: state.nextId } })
            }, AUTO_HIDE),
            id: state.nextId
          }],
        nextId: state.nextId + 1
      }
    case actions.REMOVE: {
      const idxToRemove = findIndex(state.feedbacks, f => f.id === action.data.id)
      if (idxToRemove === -1) return state
      return {
        ...state,
        feedbacks: [...state.feedbacks.slice(0, idxToRemove), ...state.feedbacks.slice(idxToRemove + 1)]
      }
    }
    case actions.SET:
      return {
        ...state,
        feedbacks: action.data
      }
    default:
      return state
  }
}

export default function Context (props) {
  const [state, dispatch] = React.useReducer(reducer, initState)
  const setFeedbacks = (newFeedbacks) => {
    dispatch({ type: actions.SET, data: newFeedbacks })
  }
  const pushFeedback = (newFeedback) => {
    dispatch({ type: actions.ADD, data: newFeedback, dispatch })
    // Update current feedback array (same array will be used if multiple calls to pushFeedback in the same render loop)
    state.feedbacks.push(newFeedback)
  }

  console.log('======> Updating feedback context')

  return (
    <FeedbackContext.Provider value={{
      // feedbacks: [...state.feedbacks, { message: 'test', type: 'warning' }],
      feedbacks: state.feedbacks,
      setFeedbacks,
      pushFeedback
    }}
    >
      {props.children}
      <FeedbackContext.Consumer>
        {({ feedbacks, setFeedbacks }) =>
          <Alert
            open={!!feedbacks.length}
            alerts={feedbacks.map((f, idx) => ({
              ...f,
              onClose: () => dispatch({ type: actions.REMOVE, data: f })
            }))}
          />}
      </FeedbackContext.Consumer>
    </FeedbackContext.Provider>
  )
}
