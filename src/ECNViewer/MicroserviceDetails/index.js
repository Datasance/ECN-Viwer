import React from "react";

import ReactJson from "../../Utils/ReactJson";
import {
  Paper,
  Typography,
  makeStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  useMediaQuery,
  CircularProgress,
} from "@material-ui/core";

import { useData } from "../../providers/Data";
import getSharedStyle from "../sharedStyles";

import { icons, dateFormat, MiBFactor, prettyBytes } from "../utils";
import moment from "moment";
import lget from "lodash/get";
import Status, { MsvcStatus } from "../../Utils/Status";

import SearchBar from "../../Utils/SearchBar";
import Modal from "../../Utils/Modal";
import { useController } from "../../ControllerProvider";
import { useFeedback } from "../../Utils/FeedbackContext";
import AceEditor from "react-ace";
import yaml from "js-yaml";
import { API_VERSIONS } from "../../Utils/constants";
import { parseMicroservice } from '../../Utils/ApplicationParser'

const useStyles = makeStyles((theme) => ({
  ...getSharedStyle(theme),
  containerWithButtons: {
    display: "flex",
    "place-content": "space-between",
  },
  addnewButtonArea: {
    display: "flex",
  },
  volumesArea: {
    display: "flex",
    alignItems: "center",
  },
  container: {
    display: "flex",
    justifyContent: "end",
  },
}));
export default function MicroserviceDetails({
  microservice: selectedMicroservice,
  selectApplication,
  selectAgent,
  back
}) {
  const { data } = useData();
  const classes = useStyles();
  const [openDeleteMicroserviceDialog, setOpenDeleteMicroserviceDialog] =
    React.useState(false);
  const [openDetailsModal, setOpenDetailsModal] = React.useState(false);
  const [envFilter, setEnvFilter] = React.useState("");
  const [volumeFilter, setVolumeFilter] = React.useState("");
  const [hostFilter, sethostFilter] = React.useState("");
  const isMediumScreen = useMediaQuery("(min-width: 768px)");

  const { microservices, reducedAgents, reducedApplications, systemApplications } = data;
  const microservice =
    (microservices || []).find((a) => selectedMicroservice.uuid === a.uuid) ||
    selectedMicroservice; // Get live updates from data
  const agent = reducedAgents.byUUID[microservice.iofogUuid];

  const [editorIsChanged, setEditorIsChanged] = React.useState(false)
  const [openChangeYamlMicroserviceDialog, setOpenChangeYamlMicroserviceDialog] =
    React.useState(false);
  const [copyText, setcopyText] = React.useState("Copy All")
  const [editorDataChanged, setEditorDataChanged] = React.useState(false)
  const [fileParsing, setFileParsing] = React.useState(false)

  const _getMicroserviceImage = (m) => {
    if (!agent) {
      return "--";
    }
    for (const img of microservice.images) {
      if (img.fogTypeId === agent.fogTypeId) {
        return img.containerImage;
      }
    }
  };

  const env = microservice.env.filter(
    (e) =>
      lget(e, "key", "").toLowerCase().includes(envFilter) ||
      lget(e, "value", "").toString().toLowerCase().includes(envFilter)
  );
  if (!env.length > 0) {
    env.push({});
  }
  const volumes = reducedApplications.byName[microservice.application].microservices.find((a) => selectedMicroservice.uuid === a.uuid).volumeMappings.filter(
    (vm) =>
      lget(vm, "hostDestination", "").toLowerCase().includes(volumeFilter) ||
      lget(vm, "containerDestination", "")
        .toLowerCase()
        .includes(volumeFilter) ||
      lget(vm, "accessMode", "").toLowerCase().includes(volumeFilter) ||
      lget(vm, "type", "").toLowerCase().includes(volumeFilter)
  );

  const ports = reducedApplications.byName[microservice.application].microservices.find((a) => selectedMicroservice.uuid === a.uuid).ports.length > 0 ? reducedApplications.byName[microservice.application].microservices.find((a) => selectedMicroservice.uuid === a.uuid).ports : [];
  const extraHosts = microservice.extraHosts.filter(
    (e) =>
      lget(e, "name", "").toLowerCase().includes(hostFilter) ||
      lget(e, "value", "").toLowerCase().includes(hostFilter) ||
      lget(e, "address", "").toLowerCase().includes(hostFilter)
  );
  if (!extraHosts.length > 0) {
    extraHosts.push({});
  }

  const application = reducedApplications.byName[microservice.application];

  const mainActions = (
    <div className={classes.actions} style={{ minWidth: 0 }}>
      <icons.DeleteIcon
        onClick={() => setOpenDeleteMicroserviceDialog(true)}
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

  const { request } = useController();
  const { pushFeedback } = useFeedback();

  const [openAddPortMicroserviceDialog, setOpenAddPortMicroserviceDialog] =
    React.useState(false);
  const [openDeletePortDialog, setOpenDeletePortDialog] = React.useState(false);
  const [selectedPortObject, setselectedPortObject] = React.useState({});

  const [
    openAddVolumeMappingMicroserviceDialog,
    setOpenAddVolumeMappingMicroserviceDialog,
  ] = React.useState(false);
  const [openDeleteVolumeMappingDialog, setOpenDeleteVolumeMappingDialog] =
    React.useState(false);
  const [selectedVolumeMappingObject, setselectedVolumeMappingObject] =
    React.useState({});

  const newPortArray = {
    internal: 0,
    external: 0,
    protocol: "tcp",
    public: {
      schemes: ["http"],
      protocol: "http",
      router: {
        host: "string",
        port: 0,
      },
    },
  };
  const [PortManipulatedData, setPortManipulatedData] =
    React.useState(newPortArray);

  const newVolumeMappingArray = {
    hostDestination: "/var/dest",
    containerDestination: "/var/dest",
    accessMode: "rw",
    type: "bind",
  };
  const [VolumeMappingManipulatedData, setVolumeMappingManipulatedData] =
    React.useState(newVolumeMappingArray);

  async function deleteMicroServiceFunction() {
    if (selectedPortObject !== undefined) {
      try {
        const res = await request(
          `/api/v3/microservices/${systemApplications.length > 0 && systemApplications.some(x=>x.name === selectedMicroservice.application) ? `system/`:""}${selectedMicroservice.uuid}`,
          {
            method: "DELETE",
            headers: {
              "content-type": "application/json",
            },
          }
        );
        if (!res.ok) {
          pushFeedback({ message: res.statusText, type: "error" });
          setOpenAddPortMicroserviceDialog(false);
        } else {
          pushFeedback({ message: "Microservice Deleted", type: "success" });
          setOpenAddPortMicroserviceDialog(false);
        }
      } catch (e) {
        pushFeedback({ message: e.message, type: "error", uuid: "error" });
        setOpenAddPortMicroserviceDialog(false);
      }
    }
  }

  async function addPortFunction() {
    try {
      const res = await request(
        `/api/v3/microservices/${systemApplications.length > 0 && systemApplications.some(x=>x.name === selectedMicroservice.application) ? `system/`:""}${selectedMicroservice.uuid}/port-mapping`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(PortManipulatedData?.updated_src),
        }
      );
      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: "error" });
      } else {
        pushFeedback({ message: "Controller Updated", type: "success" });
        setOpenAddPortMicroserviceDialog(false);
        setPortManipulatedData(newPortArray);
      }
    } catch (e) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  }

  async function deletePortFunction() {
    if (selectedPortObject !== undefined) {
      try {
        const res = await request(
          `/api/v3/microservices/${systemApplications.length > 0 && systemApplications.some(x=>x.name === selectedMicroservice.application) ? `system/`:""}${selectedMicroservice.uuid}/port-mapping/${selectedPortObject?.internal}`,
          {
            method: "DELETE",
            headers: {
              "content-type": "application/json",
            },
          }
        );
        if (!res.ok) {
          pushFeedback({ message: res.statusText, type: "error" });
        } else {
          pushFeedback({ message: "Controller Updated", type: "success" });
          setOpenDeletePortDialog(false);
        }
      } catch (e) {
        pushFeedback({ message: e.message, type: "error", uuid: "error" });
      }
    }
  }

  async function addVolumeMappingFunction() {
    
    try {
      const res = await request(
        `/api/v3/microservices/${systemApplications.length > 0 && systemApplications.some(x=>x.name === selectedMicroservice.application) ? `system/`:""}${selectedMicroservice.uuid}/volume-mapping`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(
            VolumeMappingManipulatedData?.updated_src !== undefined
              ? VolumeMappingManipulatedData?.updated_src
              : newVolumeMappingArray
          ),
        }
      );
      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: "error" });
      } else {
        pushFeedback({ message: "Controller Updated", type: "success" });
        setOpenAddVolumeMappingMicroserviceDialog(false);
        setVolumeMappingManipulatedData(newVolumeMappingArray);
      }
    } catch (e) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  }

  async function deleteVolumeMappingFunction() {
    if (selectedVolumeMappingObject?.id !== undefined) {
      try {
        const res = await request(
          `/api/v3/microservices/${systemApplications.length > 0 && systemApplications.some(x=>x.name === selectedMicroservice.application) ? `system/`:""}${selectedMicroservice.uuid}/volume-mapping/${selectedVolumeMappingObject?.id}`,
          {
            method: "DELETE",
            headers: {
              "content-type": "application/json",
            },
          }
        );
        if (!res.ok) {
          pushFeedback({ message: res.statusText, type: "error" });
        } else {
          pushFeedback({ message: "Controller Updated", type: "success" });
          setOpenDeleteVolumeMappingDialog(false)
        }
      } catch (e) {
        pushFeedback({ message: e.message, type: "error", uuid: "error" });
      }
    }
  }

  function unsecuredCopyFunction(textToCopy) {
    const textarea = document.createElement('textarea');
    textarea.value = textToCopy;

    // Move the textarea outside the viewport to make it invisible
    textarea.style.position = 'absolute';
    textarea.style.left = '-99999999px';

    document.body.prepend(textarea);

    // highlight the content of the textarea element
    textarea.select();

    try {
      document.execCommand('copy');
    } catch (err) {
      console.log(err);
    } finally {
      textarea.remove();
    }
    setcopyText("Copy All");
  }


  const _getApplicationYAMLFromJSON = (app) => {
    return {
      apiVersion: "datasance.com/v3",
      kind: "Microservice",
      metadata: {
        name: app.name,
      },
      spec: {
        uuid: app.uuid,
        name: app.name,
        agent: {
            name: agent?.name,
        },
        images: app.images.reduce(
          (acc, image) => {
            switch (image.fogTypeId) {
              case 1:
                acc.x86 = image.containerImage;
                break;
              case 2:
                acc.arm = image.containerImage;
                break;
            }
            return acc;
          },
          {
            registry: app.registryId,
            catalogItemId: app.catalogItemId,
          }
        ),
        container: {
          rootHostAccess: app.rootHostAccess,
          runAsUser: app?.runAsUser,
          platform: app?.platform,
          runtime: app?.runtime,
          cdiDevices: app?.cdiDevices !== undefined ? app?.cdiDevices : [],
          volumes: app.volumeMappings.map((vm) => {
            delete vm.id;
            return vm;
          }),
          env: app.env.map((env) => {
            delete env.id;
            return env;
          }),
          ports: app.ports.map((p) => {
            if (p.host) {
              p.host = (
                reducedAgents.byUUID[p.host] || { name: p.host }
              ).name;
            }
            return p;
          }),
          commands: app.cmd.map((cmd) => {
            delete cmd.id;
            return cmd;
          }),
        },
        config: JSON.parse(app?.config),
        application: app?.application,
        rebuild: app?.rebuild,
      }
    };
  };

  const yamlDump = React.useMemo(
    () => yaml.dump(_getApplicationYAMLFromJSON(microservice)),
    [microservice]
  );

  const parseMicroserviceFile = async (doc) => {
    if (API_VERSIONS.indexOf(doc.apiVersion) === -1) {
      return [{}, `Invalid API Version ${doc.apiVersion}, current version is ${API_VERSIONS.slice(-1)[0]}`]
    }
    if (doc.kind !== 'Microservice') {
      return [{}, `Invalid kind ${doc.kind}`]
    }
    if (!doc.metadata || !doc.spec) {
      return [{}, 'Invalid YAML format']
    }
    let tempObject = await parseMicroservice(doc.spec)
    const microserviceData = {
      name: lget(doc, 'metadata.name', undefined),
      ...tempObject,
    }
    return [microserviceData]
  }

  async function yamlChangesSave(item) {
    setFileParsing(true)
    if (item) {
      try {
        const doc = yaml.load(item)
        const [microserviceData, err] = await parseMicroserviceFile(doc)
        if (err) {
          setFileParsing(false)
          setOpenChangeYamlMicroserviceDialog(false);
          return pushFeedback({ message: err, type: 'error' })
        }
        const newMicroservice = microserviceData
        const res = await deployMicroservice(newMicroservice)
        if (!res.ok) {
          try {
            const error = await res.json()
            pushFeedback({ message: error.message, type: 'error' })
            setFileParsing(false)
            setOpenChangeYamlMicroserviceDialog(false);
          } catch (e) {
            pushFeedback({ message: res.statusText, type: 'error' })
            setFileParsing(false)
            setOpenChangeYamlMicroserviceDialog(false);
          }
        } else {
          pushFeedback({ message: 'Microservice updated!', type: 'success' })
          setFileParsing(false)
          setOpenChangeYamlMicroserviceDialog(false);
        }
      } catch (e) {
        pushFeedback({ message: e.message, type: 'error' })
        setFileParsing(false)
        setOpenChangeYamlMicroserviceDialog(false);
      }
    }
  }

  const deployMicroservice = async (microservice) => {
    
    let isSystem = systemApplications.length > 0 && systemApplications.some(x=>x.name === selectedMicroservice.application)
    const url = `/api/v3/microservices/${isSystem ? `system/`:""}${`${selectedMicroservice.uuid}`}`
    try {
      const res = await request(url, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(microservice)
      })
      return res
    } catch (e) {
      pushFeedback({ message: e.message, type: 'error' })
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
            <MsvcStatus
              status={microservice.status.status}
              style={{ marginRight: "5px", marginTop: "-3px" }}
            />
            {microservice.status.status}
            {microservice.status.status === "PULLING" &&
              ` (${microservice.status.percentage.toFixed(2)}%)`}
          </span>
          {microservice.status.errorMessage && (
            <span className={classes.subTitle}>
              Error:{" "}
              <span className={classes.text}>
                {microservice.status.errorMessage}
              </span>
            </span>
          )}
        </div>
        <div className={classes.sectionDivider} />
        <div
          className={[classes.section, "paper-container-right"].join(" ")}
          style={{ paddingBottom: "15px" }}
        >
          <Typography variant="subtitle2" className={classes.title}>
            <span>Description</span>
            {isMediumScreen && mainActions}
          </Typography>
          <span className={classes.text}>{microservice.description}</span>
        </div>
      </Paper>
      <Paper className={`section ${classes.multiSections}`}>
        <div className={[classes.section, "paper-container-left"].join(" ")}>
          <Typography variant="subtitle2" className={classes.title}>
            <span>Microservices Details</span>
            {!isMediumScreen && detailActions}
          </Typography>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>Image</span>
            <span className={classes.text}>
              {_getMicroserviceImage(microservice)}
            </span>
          </div>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>Application</span>
            <span
              className={`${classes.text} ${classes.action}`}
              onClick={() => selectApplication(application)}
            >
              <span style={{ display: "flex", alignItems: "center" }}>
                <Status
                  status={application?.isActivated ? "RUNNING" : "UNKNOWN"}
                  size={10}
                  style={{ marginRight: "5px", "--pulse-size": "5px" }}
                />
                <span />
                {application.name}
              </span>
            </span>
          </div>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>Agent</span>
            {agent ? (
              <span
                className={`${classes.text} ${classes.action}`}
                onClick={() => selectAgent(agent)}
              >
                <span style={{ display: "flex", alignItems: "center" }}>
                  <Status
                    status={agent.daemonStatus}
                    size={10}
                    style={{ marginRight: "5px", "--pulse-size": "5px" }}
                  />
                  <span />
                  {agent.name}
                </span>
              </span>
            ) : (
              ""
            )}
          </div>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>Created at</span>
            <span className={classes.text}>
              {moment(microservice.createdAt).format(dateFormat)}
            </span>
          </div>
        </div>
        <div className={classes.sectionDivider} />
        <div
          className={[classes.section, "paper-container-right"].join(" ")}
          style={{ paddingBottom: "15px" }}
        >
          <Typography variant="subtitle2" className={classes.title}>
            <span>Resources Utilization</span>
            {isMediumScreen && detailActions}
          </Typography>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>CPU Usage</span>
            <span className={classes.text}>
              {(microservice.status.cpuUsage * 1).toFixed(2) + "%"}
            </span>
          </div>
          <div className={classes.subSection}>
            <span className={classes.subTitle}>Memory Usage</span>
            <span className={classes.text}>{`${prettyBytes(
              microservice.status.memoryUsage || 0 * MiBFactor
            )} / ${prettyBytes(agent.systemAvailableMemory || 0)} (${(
              (microservice.status.memoryUsage / agent.systemAvailableMemory) *
              100 || 0
            ).toFixed(2)}%)`}</span>
          </div>
        </div>
      </Paper>
      <Paper className="section">
        <div className="section-container">
          <div
            className={[
              classes.section,
              classes.cardTitle,
              "paper-container-left",
              "paper-container-right",
            ].join(" ")}
          >
            <div className={classes.containerWithButtons}>
              <Typography variant="subtitle2" className={classes.title}>
                <span className={classes.stickyLeft}>Ports</span>
              </Typography>
              <div className={classes.addnewButtonArea}>
                <Button
                  color="primary"
                  onClick={() => setOpenAddPortMicroserviceDialog(true)}
                >
                  {`Add New`}
                </Button>
              </div>
            </div>
          </div>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  className={classes.tableTitle}
                  classes={{ stickyHeader: classes.stickyHeaderCell }}
                  style={{ top: "54px" }}
                >
                  Internal
                </TableCell>
                <TableCell
                  className={classes.tableTitle}
                  classes={{ stickyHeader: classes.stickyHeaderCell }}
                  style={{ top: "54px" }}
                >
                  External
                </TableCell>
                <TableCell
                  className={classes.tableTitle}
                  classes={{ stickyHeader: classes.stickyHeaderCell }}
                  style={{ top: "54px" }}
                >
                  Protocol
                </TableCell>
                <TableCell
                  className={classes.tableTitle}
                  classes={{ stickyHeader: classes.stickyHeaderCell }}
                  style={{ top: "54px" }}
                >
                  PublicLink
                </TableCell>
                <TableCell
                  className={classes.tableTitle}
                  classes={{ stickyHeader: classes.stickyHeaderCell }}
                  style={{ top: "54px" }}
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ports.length > 0
                ? ports.map((p) => (
                  <TableRow
                    key={p.external}
                    hover
                    classes={{ hover: classes.tableRowHover }}
                  >
                    <TableCell component="th" scope="row">
                      {p.internal}
                    </TableCell>
                    <TableCell>{p.external}</TableCell>
                    <TableCell>
                      {p.protocol
                        ? p.protocol === "udp"
                          ? p.protocol
                          : "tcp"
                        : ""}
                    </TableCell>
                    <TableCell>
                      <a
                        className={classes.link}
                        href={p.public?.links?.join(",")}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {p.public?.links?.join(",")}
                      </a>
                    </TableCell>
                    <TableCell>
                      <icons.DeleteIcon
                        onClick={() => {
                          setselectedPortObject(p);
                          setOpenDeletePortDialog(true);
                        }}
                        className={classes.action}
                        title="Delete application"
                      />
                    </TableCell>
                  </TableRow>
                ))
                : null}
            </TableBody>
          </Table>
        </div>
      </Paper>
      <Paper className="section">
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
              <span className={classes.stickyLeft}>Volumes</span>
              <div className={classes.volumesArea}>
                <SearchBar
                  onSearch={setVolumeFilter}
                  inputClasses={{ root: classes.narrowSearchBar }}
                  classes={{ root: classes.stickyRight }}
                />
                <Button
                  color="primary"
                  onClick={() =>
                    setOpenAddVolumeMappingMicroserviceDialog(true)
                  }
                >
                  {`Add New`}
                </Button>
              </div>
            </Typography>
          </div>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  className={classes.tableTitle}
                  classes={{ stickyHeader: classes.stickyHeaderCell }}
                  style={{ top: "54px" }}
                >
                  Host
                </TableCell>
                <TableCell
                  className={classes.tableTitle}
                  classes={{ stickyHeader: classes.stickyHeaderCell }}
                  style={{ top: "54px" }}
                >
                  Container
                </TableCell>
                <TableCell
                  className={classes.tableTitle}
                  classes={{ stickyHeader: classes.stickyHeaderCell }}
                  style={{ top: "54px" }}
                >
                  Acces Mode
                </TableCell>
                <TableCell
                  className={classes.tableTitle}
                  classes={{ stickyHeader: classes.stickyHeaderCell }}
                  style={{ top: "54px" }}
                >
                  Type
                </TableCell>
                <TableCell
                  className={classes.tableTitle}
                  classes={{ stickyHeader: classes.stickyHeaderCell }}
                  style={{ top: "54px" }}
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {volumes?.length > 0
                ? volumes?.map((p) => (
                  <TableRow
                    key={p.containerDestination}
                    hover
                    classes={{ hover: classes.tableRowHover }}
                  >
                    <TableCell component="th" scope="row">
                      {p.hostDestination}
                    </TableCell>
                    <TableCell>{p.containerDestination}</TableCell>
                    <TableCell>{p.accessMode}</TableCell>
                    <TableCell>{p.type}</TableCell>
                    <TableCell>
                      <icons.DeleteIcon
                        onClick={() => {
                          setselectedVolumeMappingObject(p);
                          setOpenDeleteVolumeMappingDialog(true);
                        }}
                        className={classes.action}
                        title="Delete volume"
                      />
                    </TableCell>
                  </TableRow>
                ))
                : null}
            </TableBody>
          </Table>
        </div>
      </Paper>
      <Paper className="section">
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
              <span className={classes.stickyLeft}>Environment variables</span>
              <SearchBar
                onSearch={setEnvFilter}
                inputClasses={{ root: classes.narrowSearchBar }}
                classes={{ root: classes.stickyRight }}
              />
            </Typography>
          </div>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  className={classes.tableTitle}
                  classes={{ stickyHeader: classes.stickyHeaderCell }}
                  style={{ top: "54px", maxWidth: "200px" }}
                >
                  Key
                </TableCell>
                <TableCell
                  className={classes.tableTitle}
                  classes={{ stickyHeader: classes.stickyHeaderCell }}
                  style={{ top: "54px", maxWidth: "200px" }}
                >
                  Value
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {env.map((p) => (
                <TableRow
                  key={p.key}
                  hover
                  classes={{ hover: classes.tableRowHover }}
                >
                  <TableCell
                    component="th"
                    scope="row"
                    style={{ maxWidth: "200px" }}
                  >
                    {p.key}
                  </TableCell>
                  <TableCell
                    style={{ maxWidth: "200px", wordWrap: "break-word" }}
                  >
                    {p.value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Paper>
      <Paper className="section">
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
              <span className={classes.stickyLeft}>Extra hosts</span>
              <SearchBar
                onSearch={sethostFilter}
                inputClasses={{ root: classes.narrowSearchBar }}
                classes={{ root: classes.stickyRight }}
              />
            </Typography>
          </div>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  className={classes.tableTitle}
                  classes={{ stickyHeader: classes.stickyHeaderCell }}
                  style={{ top: "54px" }}
                >
                  Name
                </TableCell>
                <TableCell
                  className={classes.tableTitle}
                  classes={{ stickyHeader: classes.stickyHeaderCell }}
                  style={{ top: "54px" }}
                >
                  Address
                </TableCell>
                <TableCell
                  className={classes.tableTitle}
                  classes={{ stickyHeader: classes.stickyHeaderCell }}
                  style={{ top: "54px" }}
                >
                  Value
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {extraHosts.map((p) => (
                <TableRow
                  key={p.name}
                  hover
                  classes={{ hover: classes.tableRowHover }}
                >
                  <TableCell component="th" scope="row">
                    {p.name}
                  </TableCell>
                  <TableCell>{p.address}</TableCell>
                  <TableCell>{p.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Paper>
      <Paper
        className="section"
        style={{ maxHeight: "800px", paddingBottom: "15px" }}
      >
        <div
          className={[
            classes.section,
            "paper-container-left",
            "paper-container-right",
          ].join(" ")}
        >
          <Typography
            variant="subtitle2"
            className={classes.title}
            style={{ zIndex: 5 }}
          >
            Microservice YAML
          </Typography>

          <div className={classes.container}>
            {editorIsChanged ? <div className={classes.copyButton}>
              <Button
                onClick={() => {
                  setOpenChangeYamlMicroserviceDialog(true);
                }}
              >
                {`Save Changes`}
              </Button>
            </div> : null}
            <div className={classes.copyButton}>
              <Button
                autoFocus
                onClick={() => {
                  setcopyText("Copied");
                  unsecuredCopyFunction(!editorDataChanged ? yamlDump : editorDataChanged)
                }}
              >
                {copyText}
              </Button>
            </div>
          </div>
          <AceEditor
            setOptions={{ useWorker: false }}
            mode="yaml"
            theme="monokai"
            defaultValue={yamlDump}
            onLoad={function (editor) {
              editor.renderer.setPadding(10);
              editor.renderer.setScrollMargin(10);
            }}
            style={{
              width: "100%",
              height: "700px",
              borderRadius: "4px",
            }}
            change
            onChange={function editorChanged(editor) {
              setEditorIsChanged(true)
              setEditorDataChanged(editor)
            }}
          />
        </div>
      </Paper>
      <Dialog
        open={openDeleteMicroserviceDialog}
        onClose={() => {
          setOpenDeleteMicroserviceDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Delete {microservice.name}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <span>This is not reversible.</span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteMicroserviceDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteMicroServiceFunction()}
            color="secondary"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Modal
        {...{
          open: openDetailsModal,
          title: `${microservice.name} details`,
          onClose: () => setOpenDetailsModal(false),
          size: "lg",
        }}
      >
        <ReactJson title="Microservice" src={microservice} name={false} />
      </Modal>

      <Dialog
        open={openAddPortMicroserviceDialog}
        onClose={() => {
          setOpenAddPortMicroserviceDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Add Port for {microservice.name}
        </DialogTitle>
        <DialogContent>
          {/* <DialogContentText id="alert-dialog-description">
            <span>You must fill all detail for port</span>
          </DialogContentText> */}
          <ReactJson
            title="Agent"
            src={
              PortManipulatedData?.updated_src !== undefined
                ? PortManipulatedData?.updated_src
                : newPortArray
            }
            name={false}
            reactJsonViewOnEdit={setPortManipulatedData}
            copyButtonEnable
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenAddPortMicroserviceDialog(false);
              setPortManipulatedData(newPortArray);
            }}
          >
            Cancel
          </Button>
          <Button onClick={() => addPortFunction()} color="primary" autoFocus>
            Add Port
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openDeletePortDialog}
        onClose={() => {
          setOpenDeletePortDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Delete Port {selectedPortObject.internal}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <span>This is not reversible.</span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeletePortDialog(false)}>Cancel</Button>
          <Button
            onClick={() => deletePortFunction()}
            color="secondary"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openAddVolumeMappingMicroserviceDialog}
        onClose={() => {
          setOpenAddVolumeMappingMicroserviceDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Add Volume for {microservice.name}
        </DialogTitle>
        <DialogContent>
          {/* <DialogContentText id="alert-dialog-description">
            <span>You must fill all detail for port</span>
          </DialogContentText> */}
          <ReactJson
            title="Volume"
            src={
              VolumeMappingManipulatedData?.updated_src !== undefined
                ? VolumeMappingManipulatedData?.updated_src
                : newVolumeMappingArray
            }
            name={false}
            reactJsonViewOnEdit={setVolumeMappingManipulatedData}
            copyButtonEnable
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenAddVolumeMappingMicroserviceDialog(false);
              setVolumeMappingManipulatedData(newVolumeMappingArray);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => addVolumeMappingFunction()}
            color="primary"
            autoFocus
          >
            Add Volume
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openDeleteVolumeMappingDialog}
        onClose={() => {
          setOpenDeleteVolumeMappingDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Delete Voulme {selectedVolumeMappingObject?.hostDestination}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <span>This is not reversible.</span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteVolumeMappingDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteVolumeMappingFunction()}
            color="secondary"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openChangeYamlMicroserviceDialog}
        onClose={() => {
          setOpenChangeYamlMicroserviceDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Update {microservice.name} deployment yaml?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {
              fileParsing ?
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: "center" }}><CircularProgress color='primary' size={24} /></div>
                :
                <>
                  <span>
                    Updating a yaml file will update/reinstall/reconfigure <b>{microservice.name}</b>.
                  </span>
                  <br />
                  <br />
                  <span>Do you want to proceed ?</span>
                </>
            }

          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <>
            {
              fileParsing ? null :
                <>
                  <Button onClick={() => setOpenChangeYamlMicroserviceDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      yamlChangesSave(editorDataChanged)
                    }}
                    color="primary"
                    autoFocus
                  >
                    Confirm
                  </Button>
                </>
            }
          </>

        </DialogActions>
      </Dialog>
    </>
  );
}
