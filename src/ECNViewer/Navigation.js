import React from "react";

import { Typography, Chip, Tooltip, Input, colors } from "@material-ui/core";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";

import { makeStyles, useTheme } from "@material-ui/styles";

import { ControllerContext } from "../ControllerProvider";
import { useData } from "../providers/Data";

const CONTROLLER_NAME_KEY = "ControllerName";
const DEFAULT_CONTROLLER_NAME = "Controller";

const useStyles = makeStyles((theme) => ({
  controllerInfo: {
    paddingTop: "0px",
    "& .paper": {
      padding: "5px",
    },
  },
  controllerName: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: "24px",
    fontWeight: "700",
    width: "100%",
    "&::before": {
      borderBottom: "none !important",
    },
  },
  warningChip: {
    backgroundColor: `var(--color, ${theme.colors.danger})`,
    color: "white",
  },
  controllerTitle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    textEmphasis: "bold",
    height: "60px",
    "& input": {
      textTransform: "uppercase !important",
      // color: 'white'
    },
    paddingLeft: "5px",
    backgroundColor: "white",
    borderRadius: "4px",
    color: "#506279",
  },
  navArrow: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  navBar: {
    display: "flex",
    alignItems: "center",
    fontSize: "24px",
    fontWeight: "700",
    width: "100%",
    "& span": {
      marginLeft: "5px",
      textTransform: "uppercase",
    },
  },
}));

export default function Navigation({ view, selectedElement, views, back }) {
  const classes = useStyles();
  const theme = useTheme();
  const { error } = useData();
  const { error: controllerContextError } = React.useContext(ControllerContext);

  const controllerError = error || controllerContextError || null;
  const [controllerName, setControllerName] = React.useState(() => {
    return (
      window.localStorage.getItem(CONTROLLER_NAME_KEY) ||
      DEFAULT_CONTROLLER_NAME
    );
  });

  const loseFocus = (e) => {
    const { key, target } = e;
    if (key === "Enter") {
      target.blur();
    }
  };

  const updateControllerName = (e) => {
    const name = e.target.value;
    window.localStorage.setItem(CONTROLLER_NAME_KEY, name);
    setControllerName(name);
  };

  React.useEffect(() => {
    if (controllerName === DEFAULT_CONTROLLER_NAME) {
      window.document.title = "ECN Viewer";
      return;
    }
    // window.document.title = controllerName
  }, [controllerName]);

  const _getContent = (view) => {
    switch (view) {
      case views.AGENT_DETAILS:
      case views.APPLICATION_DETAILS:
      case views.MICROSERVICE_DETAILS:
        return (
          <Typography className={classes.navBar} variant="h5">
            <div onClick={back} className={classes.navArrow}>
              <ArrowBackIcon />
            </div>
            <span>{selectedElement && selectedElement.name}</span>
          </Typography>
        );
      case views.DEFAULT:
      default:
        return (
          <Typography
            className={classes.navBar}
            style={{ width: "100%" }}
            variant="h5"
          >
            <Input
              className={classes.controllerName}
              value={controllerName}
              onChange={updateControllerName}
              onKeyDown={loseFocus}
            />
          </Typography>
        );
    }
  };

  return (
    <div className={classes.controllerInfo}>
      <div className={classes.controllerTitle}>
        {_getContent(view)}
        {controllerError && (
          <Tooltip title={controllerError.message} aria-label="Error">
            <Chip
              label="The controller is not reachable"
              style={{ "--color": theme.colors.gold }}
              className={classes.warningChip}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
}
