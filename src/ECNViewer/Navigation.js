import React from "react";
import { Typography, Chip, Tooltip, Input, Box, useTheme } from "@mui/material";
import { ArrowLeft as ArrowBackIcon } from "lucide-react";

import { ControllerContext } from "../ControllerProvider";
import { useData } from "../providers/Data";

const CONTROLLER_NAME_KEY = "ControllerName";
const DEFAULT_CONTROLLER_NAME = "Controller";

export default function Navigation({ view, selectedElement, views, back }) {
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
  }, [controllerName]);

  const dangerColor = theme.colors?.danger ?? theme.colors?.gold ?? "#F5A623";

  const _getContent = (view) => {
    switch (view) {
      case views.AGENT_DETAILS:
      case views.APPLICATION_DETAILS:
      case views.MICROSERVICE_DETAILS:
        return (
          <Typography
            variant="h5"
            sx={{
              display: "flex",
              alignItems: "center",
              fontSize: "24px",
              fontWeight: "700",
              width: "100%",
              "& span": { marginLeft: "5px", textTransform: "uppercase" },
            }}
          >
            <Box
              component="span"
              onClick={back}
              sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <ArrowBackIcon size={24} />
            </Box>
            <span>{selectedElement && selectedElement.name}</span>
          </Typography>
        );
      case views.DEFAULT:
      default:
        return (
          <Typography
            variant="h5"
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              fontSize: "24px",
              fontWeight: "700",
              "& span": { marginLeft: "5px", textTransform: "uppercase" },
            }}
          >
            <Input
              value={controllerName}
              onChange={updateControllerName}
              onKeyDown={loseFocus}
              sx={{
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                fontSize: "24px",
                fontWeight: "700",
                width: "100%",
                "&::before": { borderBottom: "none !important" },
              }}
            />
          </Typography>
        );
    }
  };

  return (
    <Box sx={{ paddingTop: "0px", "& .paper": { padding: "5px" } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "60px",
          paddingLeft: "5px",
          backgroundColor: "white",
          borderRadius: "4px",
          color: "#506279",
          "& input": { textTransform: "uppercase !important" },
        }}
      >
        {_getContent(view)}
        {controllerError && (
          <Tooltip title={controllerError.message} aria-label="Error">
            <Chip
              label="The controller is not reachable"
              sx={{
                backgroundColor: dangerColor,
                color: "white",
              }}
            />
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
