import React from "react";
import {
  List,
  ListSubheader,
  ListItemButton,
  ListItemText,
  Collapse,
} from "@mui/material";
import {
  ChevronUp as ExpandLess,
  ChevronDown as ExpandMore,
} from "lucide-react";

export default function NestedList(props) {
  const collection = props.collection || [];
  return (
    <List
      id={props.id}
      subheader={
        props.subHeader ? (
          <ListSubheader component="div" id={`${props.id}-subheader`}>
            {props.subHeader}
          </ListSubheader>
        ) : null
      }
    >
      {collection.map((c) => {
        const selected = props.isSelected(c);
        return (
          <React.Fragment key={c.name ?? c.id ?? JSON.stringify(c)}>
            <ListItemButton
              selected={selected}
              onClick={() => props.handleClick(c)}
            >
              <ListItemText primary={c.name} />
              {selected ? <ExpandLess size={20} /> : <ExpandMore size={20} />}
            </ListItemButton>
            <Collapse in={selected} timeout="auto" unmountOnExit>
              {props.subList.render(c)}
            </Collapse>
          </React.Fragment>
        );
      })}
    </List>
  );
}
