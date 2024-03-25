import React from "react";

import ReactJson from "../../Utils/ReactJson";
import {
  Paper,
  Typography,
  makeStyles,
  Icon,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  useMediaQuery,
} from "@material-ui/core";

import { useData } from "../../providers/Data";
import { dateFormat, MiBFactor, fogTypes, icons, prettyBytes } from "../utils";

import getSharedStyle from "../sharedStyles";

import moment from "moment";
import { useFeedback } from "../../Utils/FeedbackContext";

import MicroservicesTable from "../MicroservicesTable";
import Status from "../../Utils/Status";
import Modal from "../../Utils/Modal";
import EdgeResourceDetails from "./EdgeResourceDetails";
import { useController } from "../../ControllerProvider";

const useStyles = makeStyles((theme) => ({
  ...getSharedStyle(theme),
  rebootAndDeleteArea: {
    display: "flex",
    justifyContent: "end",
  },
}));

export default function AgentDetails({
  agent: selectedAgent,
  selectApplication,
  selectMicroservice,
  back,
}) {
  const {
    data,
    deleteAgent: _deleteAgent,
    toggleApplication: _toggleApplication,
    deleteApplication: _deleteApplication,
  } = useData();
  const { request } = useController();
  const { pushFeedback } = useFeedback();
  const [openDeleteAgentDialog, setOpenDeleteAgentDialog] =
    React.useState(false);
  const [openDeleteApplicationDialog, setOpenDeleteApplicationDialog] =
    React.useState(false);
  const [selectedApplication, setSelectedApplication] = React.useState({});
  const [openDetailsModal, setOpenDetailsModal] = React.useState(false);
  const [openERDetailsModal, setOpenERDetailsModal] = React.useState(false);
  const [selectedER, setSelectedER] = React.useState({});
  const classes = useStyles();
  const isMediumScreen = useMediaQuery("(min-width: 768px)");
  const [openRebootAgentDialog, setOpenRebootAgentDialog] =
  React.useState(false);
  const { msvcsPerAgent, controller, applications } = data;
  const agent =
    (controller.agents || []).find((a) => selectedAgent.uuid === a.uuid) ||
    selectedAgent; // Get live updates from data
  const applicationsByName = React.useMemo(() => {
    return (msvcsPerAgent[agent.uuid] || []).reduce((acc, m) => {
      if (acc[m.application]) {
        acc[m.application].microservices.push(m);
      } else {
        acc[m.application] = {
          microservices: [m],
          application: applications.find((a) => a.name === m.application),
        };
      }
      return acc;
    }, {});
  }, [msvcsPerAgent, agent]);

  const deleteAgent = async () => {
    try {
      const response = await _deleteAgent(selectedAgent);
      if (response.ok) {
        pushFeedback({ type: "success", message: "Agent deleted!" });
        back();
      } else {
        pushFeedback({ type: "error", message: response.status });
      }
    } catch (e) {
      pushFeedback({ type: "error", message: e.message || e.status });
    }
  };

  const toggleApplication = async (app) => {
    try {
      const response = await _toggleApplication(app);
      if (response.ok) {
        app.isActivated = !app.isActivated;
        pushFeedback({
          type: "success",
          message: `Application ${app.isActivated ? "Started" : "Stopped"}!`,
        });
      } else {
        pushFeedback({ type: "error", message: response.status });
      }
    } catch (e) {
      pushFeedback({ type: "error", message: e.message || e.status });
    }
  };

  const restartApplication = async (app) => {
    await toggleApplication(app);
    await toggleApplication(app);
  };

  const deleteApplication = async (app) => {
    try {
      const response = await _deleteApplication(app);
      if (response.ok) {
        pushFeedback({ type: "success", message: "Application Deleted!" });
        setOpenDeleteApplicationDialog(false);
        setSelectedApplication({});
      } else {
        pushFeedback({ type: "error", message: response.status });
      }
    } catch (e) {
      pushFeedback({ type: "error", message: e.message || e.status });
    }
  };

  const _getSeeDetailsMessage = (application) => {
    if (
      application.application.microservices.lenght ===
      application.microservices.lenght
    ) {
      return "See application details >";
    }
    if (application.application.microservices.lenght < 2) {
      return "See application details >";
    }
    return `See all ${application.application.microservices.lenght} Msvcs for this app >`;
  };

  const mainActions = (
    <div className={classes.actions} style={{ minWidth: "unset" }}>
      <icons.DeleteIcon
        onClick={() => setOpenDeleteAgentDialog(true)}
        className={classes.action}
        title="Delete application"
      />
    </div>
  );

  const detailActions = (
    <div className={classes.actions} style={{ minWidth: 0 }}>
      <icons.CodeIcon
        onClick={() => setOpenDetailsModal(true)}
        className={classes.action}
        title="Details"
      />
    </div>
  );

  const rebootActions = (
    <div className={classes.actions} style={{ minWidth: "unset", marginRight:"0.3rem" }}>
      <icons.SettingsBackupRestoreIcon
        onClick={() => setOpenRebootAgentDialog(true)}
        className={classes.action}
        title="Reboot Agent"
      />
    </div>
  );

  async function rebootAgent() {
    try {
      const res = await request(
        `/api/v1/iofog/${selectedAgent.uuid}/reboot`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
        }
      );
      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: "error" });
      } else {
        pushFeedback({ message: "Agent Rebooted", type: "success" });
      }
    } catch (e) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  }

  return (
    <>
      <Paper className={`section first ${classes.multiSections}`}>
        <div
          className={[
            classes.section,
            "paper-container-left",
            classes.bottomPad,
          ].join(" ")}
        >
          <Typography variant="subtitle2" className={classes.title}>
            <span>Status</span>
            {!isMediumScreen && mainActions}
          </Typography>
          <span
            className={classes.text}
            style={{ display: "flex", alignItems: "center" }}
          >
            <Status
              status={agent.daemonStatus}
              style={{ marginRight: "5px", marginTop: "-3px" }}
            />
            {agent.daemonStatus}
          </span>
          {/* <span className={classes.subTitle} style={{ marginTop: '15px' }}>Last Active: <span className={classes.text}>{agent.lastStatusTime ? moment(agent.lastStatusTime).format(dateFormat) : '--'}</span></span> */}
        </div>
        <div className={classes.sectionDivider} />
        <div
          className={[classes.section].join(" ")}
          style={{ paddingBottom: "15px" }}
        >
          <Typography variant="subtitle2" className={classes.title}>
            <span>Last Active</span>
          </Typography>
          <span className={classes.text}>
            {agent.lastStatusTime
              ? moment(agent.lastStatusTime).format(dateFormat)
              : "--"}
          </span>
        </div>
        <div className={classes.sectionDivider} />
        <div
          className={[classes.section, "paper-container-right"].join(" ")}
          style={{ paddingBottom: "15px" }}
        >
          <Typography variant="subtitle2" className={classes.title}>
            <span>Description</span>
            <div className={classes.rebootAndDeleteArea}>
              {isMediumScreen && rebootActions}
              {isMediumScreen && mainActions}
            </div>
          </Typography>
          <span className={classes.text}>{agent.description}</span>
        </div>
      </Paper>
      <Paper className={`section ${classes.multiSections}`}>
        <div
          className={[
            classes.section,
            "paper-container-left",
            classes.bottomPad,
          ].join(" ")}
        >
          <Typography variant="subtitle2" className={classes.title}>
            <span>Agent Details</span>
            {!isMediumScreen && detailActions}
          </Typography>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>Version</span>
            <span className={classes.text}>{agent.version}</span>
          </div>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>Type</span>
            <span className={classes.text}>{fogTypes[agent.fogTypeId]}</span>
          </div>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>Address</span>
            <span className={classes.text}>
              {agent.host || agent.ipAddressExternal || agent.ipAddress}
            </span>
          </div>
          <div className={classes.subSection} style={{ paddingBottom: 0 }}>
            <span className={classes.subTitle}>Created</span>
            <span className={classes.text}>
              {moment(agent.createdAt).format(dateFormat)}
            </span>
          </div>
        </div>
        <div className={classes.sectionDivider} />
        <div className={classes.section}>
          <Typography variant="subtitle2" className={classes.title}>
            Resource Utilization
          </Typography>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>CPU Usage</span>
            <span className={classes.text}>
              {(agent.cpuUsage * 1).toFixed(2) + "%"}
            </span>
          </div>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>Memory Usage</span>
            <span className={classes.text}>{`${prettyBytes(
              agent.memoryUsage * MiBFactor
            )} / ${prettyBytes(agent.systemAvailableMemory)} (${(
              ((agent.memoryUsage * MiBFactor) / agent.systemAvailableMemory) *
                100 || 0
            ).toFixed(2)}%)`}</span>
          </div>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>Disk Usage</span>
            <span className={classes.text}>{`${prettyBytes(
              agent.diskUsage * MiBFactor
            )} / ${prettyBytes(agent.systemAvailableDisk)} (${(
              ((agent.diskUsage * MiBFactor) / agent.systemAvailableDisk) *
                100 || 0
            ).toFixed(2)}%)`}</span>
          </div>
        </div>
        <div className={classes.sectionDivider} />
        <div
          className={[classes.section, "paper-container-right"].join(" ")}
          style={{ paddingBottom: "15px" }}
        >
          <Typography variant="subtitle2" className={classes.title}>
            <span>Edge Resources</span>
            {isMediumScreen && detailActions}
          </Typography>
          {agent.edgeResources.map((er) => (
            <div
              key={`${er.name}_${er.version}`}
              className={classes.edgeResource}
            >
              <div
                className={classes.erIconContainer}
                style={{ "--color": "white" }}
              >
                {er.display && er.display.icon && (
                  <Icon
                    title={er.display.name || er.name}
                    className={classes.erIcon}
                  >
                    {er.display.icon}
                  </Icon>
                )}
              </div>
              <div
                className={`${classes.text} ${classes.action}`}
                onClick={() => {
                  setSelectedER(er);
                  setOpenERDetailsModal(true);
                }}
                style={{ marginLeft: "5px" }}
              >
                {(er.display && er.display.name) || er.name} {er.version}
              </div>
            </div>
          ))}
        </div>
      </Paper>
      {Object.keys(applicationsByName).map((applicationName) => (
        <Paper
          key={applicationName}
          className="section"
          style={{ paddingBottom: 0 }}
        >
          <div className="section-container">
            <div
              className={[
                classes.section,
                classes.cardTitle,
                "paper-container-left",
                "paper-container-right",
              ].join(" ")}
            >
              <Typography variant="subtitle2" className={classes.title}>
                <span
                  className={[classes.stickyLeft, classes.textEllipsis].join(
                    " "
                  )}
                  title={applicationName}
                >
                  {applicationName}
                </span>
                <div
                  className={[classes.actions, "sticky-right"].join(" ")}
                  style={{ minWidth: "100px" }}
                >
                  <icons.DeleteIcon
                    className={classes.action}
                    title="Delete application"
                    onClick={() => {
                      setSelectedApplication(
                        applicationsByName[applicationName].application
                      );
                      setOpenDeleteApplicationDialog(true);
                    }}
                  />
                  {applicationsByName[applicationName].application
                    .isActivated ? (
                    <icons.RestartIcon
                      className={classes.action}
                      onClick={() =>
                        restartApplication(
                          applicationsByName[applicationName].application
                        )
                      }
                      title="Restart application"
                    />
                  ) : (
                    <icons.RestartIcon
                      className={classes.disabledAction}
                      title="Restart application"
                    />
                  )}
                  {applicationsByName[applicationName].application
                    .isActivated ? (
                    <icons.StopIcon
                      className={classes.action}
                      onClick={() =>
                        toggleApplication(
                          applicationsByName[applicationName].application
                        )
                      }
                      title="Stop application"
                    />
                  ) : (
                    <icons.PlayIcon
                      className={classes.action}
                      onClick={() =>
                        toggleApplication(
                          applicationsByName[applicationName].application
                        )
                      }
                      title="Start application"
                    />
                  )}
                </div>
              </Typography>
            </div>
            <MicroservicesTable
              nameTitle="Msvc Name"
              application={applicationsByName[applicationName]}
              selectMicroservice={selectMicroservice}
              showVolumes
            />
            <div
              style={{
                textAlign: "right",
                fontSize: "16px",
                fontWeight: "300",
                paddingTop: "30px",
                paddingBottom: "15px",
                fontStyle: "italic",
                position: "sticky",
                bottom: "0",
                right: "15px",
                float: "right",
                zIndex: 6,
                backgroundColor: "white",
              }}
            >
              <span
                className={classes.action}
                onClick={() =>
                  selectApplication(
                    applicationsByName[applicationName].application
                  )
                }
              >
                {_getSeeDetailsMessage(applicationsByName[applicationName])}
              </span>
            </div>
          </div>
        </Paper>
      ))}
      <Dialog
        open={openDeleteAgentDialog}
        onClose={() => {
          setOpenDeleteAgentDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">Delete {agent.name}?</DialogTitle>
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
          <Button onClick={() => deleteAgent()} color="secondary" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openDeleteApplicationDialog}
        onClose={() => {
          setOpenDeleteApplicationDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Delete {selectedApplication.name}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <span>
              Deleting an Application will delete all its microservices.
            </span>
            <br />
            <span>This is not reversible.</span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteApplicationDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteApplication(selectApplication)}
            color="secondary"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Modal
        {...{
          open: openERDetailsModal,
          title: `${selectedER.name} details`,
          onClose: () => setOpenERDetailsModal(false),
          size: "lg",
        }}
      >
        <EdgeResourceDetails edgeResource={selectedER} />
      </Modal>
      <Modal
        {...{
          open: openDetailsModal,
          title: `${agent.name} details`,
          onClose: () => setOpenDetailsModal(false),
          size: "lg",
        }}
      >
        <ReactJson title="Agent" src={agent} name={false} />
      </Modal>
      <Dialog
        open={openRebootAgentDialog}
        onClose={() => {
          setOpenRebootAgentDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">Reboot {agent.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <span>Reboot microservices.</span>
            <br />
            <span>This is not reversible.</span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRebootAgentDialog(false)}>
            Cancel
          </Button>
          <Button onClick={() => rebootAgent()} color="primary" autoFocus>
            Reboot
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
