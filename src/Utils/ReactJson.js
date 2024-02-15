import { Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import React from "react";
import getSharedStyle from '../ECNViewer/sharedStyles/'
import ReactJSONView from "react-json-view";

const useStyles = makeStyles((theme) => ({
  ...getSharedStyle(theme),
  container: {
    display: "flex",
    justifyContent: "end",
  },
}));

export default function ReactJson(props) {
  const classes = useStyles();
  const [copyText, setcopyText] = React.useState("Copy All")
  return (
    <>
      {
        props?.copyButtonEnable ? 
        <div className={classes.container}>
        <div className={classes.copyButton}>
        <Button autoFocus onClick={() => {setcopyText("Copied"); navigator.clipboard.writeText(JSON.stringify(props?.src)).then(()=> {setcopyText("Copy All")})}}>
            {copyText}
          </Button>
        </div>
      </div> : null}
      <ReactJSONView
        {...props}
        theme="monokai"
        style={{ padding: "15px", borderRadius: "4px", overflow: "auto" }}
        onEdit={props?.reactJsonViewOnEdit ? (e) => props?.reactJsonViewOnEdit(e) : null}
        onAdd={props?.reactJsonViewOnEdit ? (e) => props?.reactJsonViewOnEdit(e) : null}
        onDelete={props?.reactJsonViewOnEdit ? (e) => props?.reactJsonViewOnEdit(e) : null}
        enableClipboard={false}
        displayObjectSize={false}
        iconStyle="square"
      />
    </>
  );
}
