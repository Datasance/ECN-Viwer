import React, { useEffect } from "react";
import Skeleton from "react-loading-skeleton";

import {
  Menu,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  MenuItem,
  Divider,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  DialogContentText,
  Button,
} from "@material-ui/core";

import MoreIcon from "@material-ui/icons/MoreVert";

import { makeStyles } from "@material-ui/styles";

import { fogTypes } from "../../utils";
import Icon from "@material-ui/core/Icon";

import { theme } from "../../../Theme/ThemeProvider";

import getSharedStyle from "../../sharedStyles/";
import { useFeedback } from "../../../Utils/FeedbackContext";

import Status from "../../../Utils/Status";
import ReactJson from "../../../Utils/ReactJson";
import Modal from "../../../Utils/Modal";
import { useController } from "../../../ControllerProvider";

const useStyles = makeStyles((theme) => ({
  ...getSharedStyle(theme),
  avatarList: {
    color: "white",
    backgroundColor: "var(--statusColor, white)",
    boxShadow: `0px 2px 2px ${theme.colors.neutral}`,
  },
  msvcChipList: {
    display: "flex",
    flexDirection: "column",
    width: "20%",
    flex: "1",
    paddingRight: "15px",
  },
  msvcChip: {
    marginTop: "var(--mTop, 0px)",
    backgroundColor: `var(--color, ${theme.colors.cobalt})`,
    fontSize: "10px",
    borderRadius: "5px",
    height: "20px",
    margin: "2px",
    width: "100px",
    color: "white",
    "& .MuiChip-label": {
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      overflow: "hidden",
      display: "block",
    },
  },
  jsonDisplay: {
    width: "99%",
    minHeight: "30rem",
    fontFamily: '"Lucida Console", Monaco, monospace',
    fontSize: "0.8rem",
    lineHeight: "1.2",
  },
  listTitle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    color: theme.palette.text.primary,
  },
  stickyHeader: {
    ...getSharedStyle(theme).stickyHeaderCell,
    top: "78px",
    color: theme.colors.datasance_color_0,
  },
}));

export default function AgentList(props) {
  const classes = useStyles();
  const { pushFeedback } = useFeedback();
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const {
    msvcsPerAgent,
    filter,
    agents: unfilteredAgents,
    setAgent,
    loading,
    deleteAgent: _deleteAgent,
  } = props;
  const [openDeleteAgentDialog, setOpenDeleteAgentDialog] =
    React.useState(false);
  const [selectedAgent, setSelectedAgent] = React.useState({});
  const [selectedAgentManipulatedData, setselectedAgentManipulatedData] =
    React.useState({});
  const [AgentManipulatedData, setagentManipulatedData] = React.useState({});
  const { request } = useController();
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedAgent({});
    setselectedAgentManipulatedData({});
  };
  const openMenu = (a, e) => {
    setMenuAnchorEl(e.currentTarget);
    setSelectedAgent(a);
    setselectedAgentManipulatedData({
      name: a?.name,
      location: a?.location !== null ? a?.location : "",
      latitude: a?.latitude,
      longitude: a?.longitude,
      description: a?.description !== null ? a?.description : "",
      dockerUrl: a?.dockerUrl,
      diskLimit: a?.diskLimit,
      diskDirectory: a?.diskDirectory,
      memoryLimit: a?.memoryLimit,
      cpuLimit: a?.cpuLimit,
      logLimit: a?.logLimit,
      logDirectory: a?.logDirectory,
      logFileCount: a?.logFileCount,
      statusFrequency: a?.statusFrequency,
      changeFrequency: a?.changeFrequency,
      deviceScanFrequency: a?.deviceScanFrequency,
      bluetoothEnabled: a?.bluetoothEnabled,
      watchdogEnabled: a?.watchdogEnabled,
      abstractedHardwareEnabled: a?.abstractedHardwareEnabled,
      fogType: a?.fogType,
      dockerPruningFrequency: a?.dockerPruningFrequency,
      availableDiskThreshold: a?.availableDiskThreshold,
      logLevel: a?.logLevel,
      isSystem: a?.isSystem,
      routerMode: a?.routerMode,
      messagingPort: a?.messagingPort,
      interRouterPort: a?.interRouterPort,
      edgeRouterPort: a?.edgeRouterPort,
      host: a?.host,
      upstreamRouters: a?.upstreamRouters,
      networkInterface: a?.networkInterface,
    });
  };

  const agents = unfilteredAgents.filter((a) =>
    a.name.toLowerCase().includes(filter)
  );
  const deleteAgent = async (agent) => {
    try {
      const response = await _deleteAgent(agent);
      if (response.ok) {
        pushFeedback({ type: "success", message: "Agent deleted!" });
        setOpenDeleteAgentDialog(false);
        handleCloseMenu();
      } else {
        pushFeedback({ type: "error", message: response.status });
      }
    } catch (e) {
      pushFeedback({ type: "error", message: e.message || e.status });
    }
  };
  const [updateConfigModal, setUpdateConfigModal] = React.useState(false);

  async function updateManipulatedDataFunction() {
    try {
      const res = await request(`/api/v1/iofog/${selectedAgent?.uuid}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(AgentManipulatedData?.updated_src),
      });
      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: "error" });
      } else {
        pushFeedback({ message: "Controller Updated", type: "success" });
        setUpdateConfigModal(false);
        handleCloseMenu();
      }
    } catch (e) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  }

  return (
    <>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell
              className={classes.tableTitle}
              classes={{
                stickyHeader: classes.stickyHeader,
                root: classes.headerCell,
              }}
            >
              Name
            </TableCell>
            <TableCell
              className={classes.tableTitle}
              classes={{
                stickyHeader: classes.stickyHeader,
                root: classes.headerCell,
              }}
            >
              Version
            </TableCell>
            <TableCell
              className={classes.tableTitle}
              classes={{
                stickyHeader: classes.stickyHeader,
                root: classes.headerCell,
              }}
            >
              Apps
            </TableCell>
            <TableCell
              className={classes.tableTitle}
              classes={{
                stickyHeader: classes.stickyHeader,
                root: classes.headerCell,
              }}
            >
              Msvcs
            </TableCell>
            <TableCell
              className={classes.tableTitle}
              classes={{
                stickyHeader: classes.stickyHeader,
                root: classes.headerCell,
              }}
            >
              Type
            </TableCell>
            <TableCell
              className={classes.tableTitle}
              classes={{
                stickyHeader: classes.stickyHeader,
                root: classes.headerCell,
              }}
            >
              Resources
            </TableCell>
            <TableCell
              className={classes.tableTitle}
              classes={{
                stickyHeader: classes.stickyHeader,
                root: classes.headerCell,
              }}
            />
          </TableRow>
        </TableHead>
        <TableBody>
          {loading
            ? new Array(5).fill(0).map((v, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={7}>
                    <Skeleton height={29} />
                  </TableCell>
                </TableRow>
              ))
            : agents.map((a) => {
                const msvcs = msvcsPerAgent[a.uuid] || [];
                const applications = Object.keys(
                  msvcs.reduce(
                    (acc, m) => ({ ...acc, [m.application]: true }),
                    {}
                  )
                );
                const edgeResources = a.edgeResources || [];
                return (
                  <TableRow
                    key={a.uuid}
                    classes={{ hover: classes.tableRowHover }}
                    hover
                  >
                    <TableCell
                      onClick={() => setAgent(a)}
                      classes={{ root: classes.tableCell }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Status status={a.daemonStatus} />
                        <span
                          className={classes.link}
                          style={{ marginLeft: "15px" }}
                        >
                          {a.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell classes={{ root: classes.tableCell }}>
                      {a.version}
                    </TableCell>
                    <TableCell classes={{ root: classes.tableCell }}>
                      {applications.length}
                    </TableCell>
                    <TableCell classes={{ root: classes.tableCell }}>
                      {msvcs.length}
                    </TableCell>
                    <TableCell classes={{ root: classes.tableCell }}>
                      {fogTypes[a.fogTypeId]}
                    </TableCell>
                    <TableCell classes={{ root: classes.tableCell }}>
                      {edgeResources.map((er) => {
                        return er.display && er.display.icon ? (
                          <Icon
                            key={`${er.name}${er.version}`}
                            title={er.display.name || er.name}
                            style={{ color: theme.colors.neutral_3 }}
                            className={classes.erIcon}
                          >
                            {er.display.icon}
                          </Icon>
                        ) : null;
                      })}
                    </TableCell>
                    <TableCell classes={{ root: classes.tableCell }}>
                      <MoreIcon
                        className={classes.action}
                        onClick={(e) => {
                          e.stopPropagation();
                          openMenu(a, e);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
      <Dialog
        open={openDeleteAgentDialog}
        onClose={() => {
          setOpenDeleteAgentDialog(false);
          handleCloseMenu();
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Delete {selectedAgent.name}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <span>Deleting an agent will delete all its microservices.</span>
            <br />
            <span>This is not reversible.</span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteAgentDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteAgent(selectedAgent)}
            color="secondary"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Menu
        id="agent-menu"
        anchorEl={menuAnchorEl}
        keepMounted
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => setAgent(selectedAgent)}>Details</MenuItem>
        <Divider />
        <MenuItem onClick={() => setOpenDeleteAgentDialog(true)}>
          Delete Agent
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setUpdateConfigModal(true);
          }}
        >
          Update Config
        </MenuItem>
      </Menu>
      <Modal
        {...{
          open: updateConfigModal,
          title: `Update ${selectedAgent?.name}`,
          onClose: () => {
            setUpdateConfigModal(false);
            handleCloseMenu();
          },
          size: "lg",
        }}
      >
        <ReactJson
          title="Agent"
          src={selectedAgentManipulatedData}
          name={false}
          reactJsonViewOnEdit={setagentManipulatedData}
          copyButtonEnable
        />
        <DialogActions>
          <Button
            onClick={() => {
              setUpdateConfigModal(false);
              handleCloseMenu();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => updateManipulatedDataFunction()}
            color="primary"
            autoFocus
          >
            Save
          </Button>
        </DialogActions>
      </Modal>
    </>
  );
}
