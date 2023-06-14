import React from 'react'

import ReactJSONView from 'react-json-view'

export default function ReactJson (props) {
  return <ReactJSONView {...props} theme='monokai' style={{ padding: '15px', borderRadius: '4px', overflow: 'auto' }} />
}
