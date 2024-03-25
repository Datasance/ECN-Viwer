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

  function unsecuredCopyFunction(textToCopy) {
    const textarea = document.createElement('textarea');
    textarea.value = textToCopy;
    const presentationArea = document.getElementsByClassName('MuiDialog-root')
    
    // Move the textarea outside the viewport to make it invisible
    textarea.style.position = 'absolute';
    textarea.style.zIndex = '9999';
    textarea.style.left = '-99999999px';
    presentationArea[0].prepend(textarea);

    // highlight the content of the textarea element
    textarea.select();
    textarea.focus();

    try {
      document.execCommand('copy');
    } catch (err) {
      console.log(err);
    } finally {
      textarea.remove();
    }
    setcopyText("Copy All");
  }

  return (
    <>
      {
        props?.copyButtonEnable ? 
        <div className={classes.container}>
        <div className={classes.copyButton}>
        <Button autoFocus onClick={() => {setcopyText("Copied"); unsecuredCopyFunction(JSON.stringify(props?.src))}}>
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
