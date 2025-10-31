/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useState } from "react";
import CustomDataTable from "../../CustomComponent/CustomDataTable";
import { ControllerContext } from "../../ControllerProvider";
import { FeedbackContext } from "../../Utils/FeedbackContext";
import SlideOver from "../../CustomComponent/SlideOver";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/mode-yaml";
import yaml from "js-yaml";
import { useLocation } from "react-router-dom";
import lget from "lodash/get";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import CustomLoadingModal from "../../CustomComponent/CustomLoadingModal";
import { useTerminal } from "../../providers/Terminal/TerminalProvider";

function ConfigMaps() {
  const [fetching, setFetching] = React.useState(true);
  const [configMaps, setConfigMaps] = React.useState([]);
  const { request } = React.useContext(ControllerContext);
  const { pushFeedback } = React.useContext(FeedbackContext);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConfigMap, setSelectedConfigMap] = useState<any | null>(null);
  const { addYamlSession } = useTerminal();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const configMapName = params.get("configMapName");
  const [dirtyEditors, setDirtyEditors] = React.useState<
    Record<string, boolean>
  >({});
  const [editorValues, setEditorValues] = React.useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] =
    React.useState("Config Map Adding...");

  const handleRowClick = (row: any) => {
    if (row.name) {
      fetchConfigMapItem(row.name);
    }
  };

  useEffect(() => {
    if (configMapName && configMaps) {
      const found = configMaps.find(
        (config: any) => config.name === configMapName,
      );
      if (found) {
        handleRowClick(found);
        setIsOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configMapName, configMaps]);

  async function fetchConfigMaps() {
    try {
      setFetching(true);
      const configMapsItemsResponse = await request("/api/v3/configmaps");
      if (!configMapsItemsResponse.ok) {
        pushFeedback({
          message: configMapsItemsResponse.statusText,
          type: "error",
        });
        setFetching(false);
        return;
      }
      const configMapsItems = (await configMapsItemsResponse.json()).configMaps;
      setConfigMaps(configMapsItems);
      setFetching(false);
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error" });
      setFetching(false);
    }
  }

  async function fetchConfigMapItem(configMapName: string) {
    try {
      setFetching(true);
      const itemResponse = await request(`/api/v3/configmaps/${configMapName}`);
      if (!itemResponse.ok) {
        pushFeedback({ message: itemResponse.statusText, type: "error" });
        setFetching(false);
        return;
      }
      const responseItem = await itemResponse.json();
      setSelectedConfigMap(responseItem);
      setIsOpen(true);
      setFetching(false);
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error" });
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchConfigMaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditYaml = () => {
    const { name, immutable, data = {} } = selectedConfigMap || {};

    const yamlObj = {
      apiVersion: "datasance.com/v3",
      kind: "ConfigMap",
      metadata: { name },
      spec: { immutable },
    };
    let yamlHeader = yaml
      .dump(yamlObj, {
        noRefs: true,
        indent: 2,
        lineWidth: -1,
      })
      .trimEnd();

    let dataSection = "data:\n";
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string" && value.includes("\n")) {
        dataSection += `  ${key}: |\n`;
        for (const line of value.split("\n")) {
          dataSection += `    ${line}\n`;
        }
      } else {
        dataSection += `  ${key}: ${value}\n`;
      }
    }

    const yamlString = `${yamlHeader}\n${dataSection}`;

    addYamlSession({
      title: `YAML: ${selectedConfigMap?.name}`,
      content: yamlString,
      isDirty: false,
      onSave: async (content: string) => {
        try {
          const parsedDoc = yaml.load(content);
          const [configMap, err] = await parseConfigMap(parsedDoc);

          if (err) {
            pushFeedback({ message: err, type: "error" });
            return;
          }

          await handleYamlUpdate(configMap, "PATCH");
        } catch (e: any) {
          pushFeedback({ message: e.message, type: "error", uuid: "error" });
        }
      },
    });
  };

  const handleYamlParse = async (item: any) => {
    const file = item;
    if (file) {
      const reader = new window.FileReader();

      reader.onload = async function (evt: any) {
        try {
          const docs = yaml.loadAll(evt.target.result);

          if (!Array.isArray(docs)) {
            pushFeedback({ message: "Could not parse the file: Invalid YAML format", type: "error" });
            return;
          }

          let successCount = 0;
          let errorCount = 0;

          for (const doc of docs) {
            if (!doc) {
              continue;
            }

            const [configMap, err] = await parseConfigMap(doc);

            if (err) {
              console.error("Error parsing a document:", err);
              pushFeedback({ message: `Error processing item: ${err}`, type: "error" });
              errorCount++;
            } else {
              try {
                await handleYamlUpdate(configMap, "POST");
                successCount++;
              } catch (e) {
                console.error("Error updating a document:", e);
                errorCount++;
              }
            }
          }

          if (successCount > 0) {
            pushFeedback({ message: `Successfully processed ${successCount} item(s).`, type: "success" });
          }
          if (errorCount > 0) {
            pushFeedback({ message: `Failed to process ${errorCount} item(s).`, type: "error" });
          }

        } catch (e) {
          console.error({ e });
          pushFeedback({ message: "Could not parse the file", type: "error" });
        }
      };

      reader.onerror = function (evt) {
        pushFeedback({ message: evt, type: "error" });
      };

      reader.readAsText(file, "UTF-8");
    }
  };

  async function handleYamlUpdate(configMap: any, method?: string) {
    try {
      const name = configMap.name;

      const res = await request(
        `/api/v3/configmaps/${method === "PATCH" ? "/" + name : ''}`,
        {
          method: method,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(configMap),
        }
      );

      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: "error" });
      } else {
        pushFeedback({
          message: `${name} ${method === "POST" ? "Added" : "Updated"}`,
          type: "success",
        });
        setIsOpen(false);
        fetchConfigMaps();
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  }

  const parseConfigMap = async (doc: any) => {
    if (doc.apiVersion !== "datasance.com/v3") {
      return [
        {},
        `Invalid API Version ${doc.apiVersion}, current version is datasance.com/v3`,
      ];
    }
    if (doc.kind !== "ConfigMap") {
      return [{}, `Invalid kind ${doc.kind}`];
    }
    if (!doc.metadata || !doc.data) {
      return [{}, "Invalid YAML format"];
    }
    const configMap = {
      name: lget(doc, "metadata.name", lget(doc, "spec.name", undefined)),
      immutable: lget(doc, "spec.immutable", false),
      data: lget(doc, "data", {}),
    };

    return [configMap];
  };

  const handleSave = async (key: string, updatedYamlString: string) => {
    try {
      const { name, immutable, data = {} } = selectedConfigMap || {};

      const yamlObj = {
        apiVersion: "datasance.com/v3",
        kind: "ConfigMap",
        metadata: { name },
        spec: { immutable },
      };

      const yamlHeader = yaml
        .dump(yamlObj, {
          noRefs: true,
          indent: 2,
          lineWidth: -1,
        })
        .trimEnd();

      let dataSection = "data:\n";
      for (const [dataKey, value] of Object.entries(data)) {
        if (typeof value === "string" && value.includes("\n")) {
          dataSection += `  ${dataKey}: |\n`;
          for (const line of value.split("\n")) {
            dataSection += `    ${line}\n`;
          }
        } else {
          dataSection += `  ${dataKey}: ${value}\n`;
        }
      }

      const yamlString = `${yamlHeader}\n${dataSection}`;
      const parsedObj = yaml.load(yamlString) as any;

      if (!parsedObj?.data) {
        parsedObj.data = {};
      }

      parsedObj.data[key] = updatedYamlString;

      const [configMap, err] = await parseConfigMap(parsedObj);
      if (err) {
        return pushFeedback({ message: err, type: "error" });
      }

      const res = await request(
        `/api/v3/configmaps/${selectedConfigMap?.name}`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(configMap),
        },
      );

      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: "error" });
      } else {
        pushFeedback({
          message: `${selectedConfigMap?.name} Updated`,
          type: "success",
        });
        setIsOpen(false);
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  };

  const handleDelete = async (key: string) => {
    try {
      const { name, immutable, data = {} } = selectedConfigMap || {};

      const yamlObj = {
        apiVersion: "datasance.com/v3",
        kind: "ConfigMap",
        metadata: { name },
        spec: { immutable },
      };

      const yamlHeader = yaml
        .dump(yamlObj, {
          noRefs: true,
          indent: 2,
          lineWidth: -1,
        })
        .trimEnd();

      let dataSection = "data:\n";
      for (const [dataKey, value] of Object.entries(data)) {
        if (dataKey === key) continue;

        if (typeof value === "string" && value.includes("\n")) {
          dataSection += `  ${dataKey}: |\n`;
          for (const line of value.split("\n")) {
            dataSection += `    ${line}\n`;
          }
        } else {
          dataSection += `  ${dataKey}: ${value}\n`;
        }
      }

      const yamlString = `${yamlHeader}\n${dataSection}`;
      const parsedObj = yaml.load(yamlString) as any;

      const [configMap, err] = await parseConfigMap(parsedObj);
      if (err) {
        return pushFeedback({ message: err, type: "error" });
      }

      const res = await request(
        `/api/v3/configmaps/${selectedConfigMap?.name}`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(configMap),
        },
      );

      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: "error" });
      } else {
        pushFeedback({
          message: `${selectedConfigMap?.name} Deleted key ${key}`,
          type: "success",
        });
        setIsOpen(false);
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  };

  const postCertificateItem = async (item: any) => {
    const newItem = { ...item };
    setLoadingMessage("Certificate Adding...");
    setLoading(true);
    const response = await request(
      `/api/v3/certificates/yaml`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItem),
      },
    );
    if (response?.ok) {
      pushFeedback({ message: "Certificate Added!", type: "success" });
      fetchConfigMaps();
      setLoading(false);
    } else {
      pushFeedback({ message: response?.statusText || "Something went wrong", type: "error" });
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (row: any) => (
        <div
          className="cursor-pointer text-blue-400 hover:underline"
          onClick={() => handleRowClick(row)}
        >
          {row.name}
        </div>
      ),
    },
    {
      key: "immutable",
      header: "immutable",
      render: (row: any) => <span>{row.immutable.toString() || "-"}</span>,
    },
  ];

  const slideOverFields = [
    {
      label: "Config Map Details",
      render: () => "",
      isSectionHeader: true,
    },
    {
      label: "Name",
      render: (row: any) => row.name || "N/A",
    },
    {
      label: "Immutable",
      render: (row: any) => row.immutable.toString() || "N/A",
    },
    {
      label: "Data",
      render: () => "",
      isSectionHeader: true,
    },
    {
      label: "",
      isFullSection: true,
      render: (node: any) => {
        const entries = Object.entries(node?.data || {});

        const handleChange = (
          key: string,
          newValue: string,
          originalValue: string,
        ) => {
          setEditorValues((prev) => ({ ...prev, [key]: newValue }));
          const isDirty = newValue !== originalValue;
          setDirtyEditors((prev) => ({ ...prev, [key]: isDirty }));
        };

        return (
          <div className="space-y-6">
            {entries.map(([key, rawValue], index) => {
              let parsed: any = null;

              try {
                if (typeof rawValue === "string") {
                  parsed = JSON.parse(rawValue);
                } else if (typeof rawValue === "object") {
                  parsed = rawValue;
                } else {
                  parsed = rawValue;
                }
              } catch (e) {
                parsed = rawValue;
              }

              const finalContent =
                typeof parsed === "object" ? yaml.dump(parsed) : (parsed ?? "");

              const lineHeight = 10;
              const minLines = 10;
              const maxLines = 30;
              const lineCount = Math.max(
                minLines,
                Math.min(
                  finalContent.toString()?.split("\n")?.length,
                  maxLines,
                ),
              );
              const dynamicHeight = `${lineCount * lineHeight}px`;

              const displayValue = editorValues[key] ?? finalContent.toString();

              return (
                <div key={index}>
                  <div className="flex justify-between">
                    <h2 className="text-sm font-semibold text-gray-300 mb-2">
                      {key}
                    </h2>
                    <div className="flex space-x-2">
                      {dirtyEditors[key] && (
                        <button
                          onClick={() => {
                            handleSave(key, displayValue);
                            setDirtyEditors((prev) => ({
                              ...prev,
                              [key]: false,
                            }));
                          }}
                          className="hover:text-green-600 hover:bg-white rounded"
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleDelete(key);
                        }}
                        className="hover:text-red-600 hover:bg-white rounded"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </button>
                    </div>
                  </div>

                  <AceEditor
                    mode="yaml"
                    theme="tomorrow"
                    name={`editor-${key}`}
                    value={displayValue}
                    showPrintMargin={false}
                    setOptions={{
                      useWorker: false,
                      wrap: true,
                      tabSize: 2,
                    }}
                    onChange={(newValue) =>
                      handleChange(key, newValue, finalContent.toString())
                    }
                    onLoad={(editor) => {
                      editor.renderer.setPadding(10);
                      editor.renderer.setScrollMargin(10);
                      editor.getSession().setUseWrapMode(true);
                      setTimeout(() => editor.resize(), 300);
                    }}
                    style={{
                      width: "100%",
                      height: dynamicHeight,
                      borderRadius: "4px",
                    }}
                  />
                </div>
              );
            })}
          </div>
        );
      },
    },
  ];

  return (
    <>
      {fetching ? (
        <>
          <CustomLoadingModal
            open={true}
            message="Fetching Service Details"
            spinnerSize="lg"
            spinnerColor="text-green-500"
            overlayOpacity={60}
          />
        </>
      ) : (
        <>
          <div className="bg-gray-900 text-white overflow-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
              Config Maps List
            </h1>

            <CustomDataTable
              columns={columns}
              data={configMaps}
              getRowKey={(row: any) => row.id}
              uploadDropzone
              uploadFunction={handleYamlParse}
            />
            <SlideOver
              open={isOpen}
              onClose={() => setIsOpen(false)}
              onEditYaml={handleEditYaml}
              title={selectedConfigMap?.name || "Config Map Details"}
              data={selectedConfigMap}
              fields={slideOverFields}
              customWidth={600}
            />
          </div>
        </>
      )}
    </>
  );
}

export default ConfigMaps;
