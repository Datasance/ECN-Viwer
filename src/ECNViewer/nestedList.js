import React from 'react'

import List from '@material-ui/core/List'
import ListSubheader from '@material-ui/core/ListSubheader'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import Collapse from '@material-ui/core/Collapse'

export default function NestedList (props) {
  const collection = props.collection || []
  return (
    <List
      id={props.id}
      subheader={props.subHeader
        ? (
          <ListSubheader component='div' id={`${props.id}-subheader`}>
            {props.subHeader}
          </ListSubheader>
        )
        : ''}
    >
      {collection.map(c => {
        const selected = props.isSelected(c)
        return (
          <>
            <ListItem button selected={selected} onClick={() => props.handleClick(c)}>
              <ListItemText primary={c.name} />
              {selected ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={selected} timeout='auto' unmountOnExit>
              {props.subList.render(c)}
            </Collapse>
          </>
        )
      })}
    </List>
  )
}
