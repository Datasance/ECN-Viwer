import React from 'react'
import ReactJson from '../../Utils/ReactJson'
import { useController } from '../../ControllerProvider'
import { useFeedback } from '../../Utils/FeedbackContext'

export default function EdgeResourceDetails ({ edgeResource: _edgeResource }) {
  const { request } = useController()
  const { pushFeedback } = useFeedback()
  const [edgeResource, setEdgeResource] = React.useState(_edgeResource)
  React.useEffect(() => {
    async function fetchData () {
      try {
        const res = await request(`/api/v1/edgeResource/${edgeResource.name}/${edgeResource.version}`)
        if (res.ok) {
          setEdgeResource(await res.json())
        } else {
          try {
            const message = (await res.json()).message
            pushFeedback({ message, type: 'error' })
          } catch (e) {
            pushFeedback({ message: res.statusText, type: 'error' })
          }
        }
      } catch (e) {
        pushFeedback({ message: e.message, type: 'error' })
      }
    }
    fetchData()
  }, [])
  return <ReactJson title='Edge Resource' src={edgeResource} name={false} />
}
