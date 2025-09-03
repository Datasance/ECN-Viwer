import React, { useEffect, useState } from "react";
import CustomDataTable from "../../CustomComponent/CustomDataTable";
import { ControllerContext } from "../../ControllerProvider";
import { FeedbackContext } from "../../Utils/FeedbackContext";
import SlideOver from "../../CustomComponent/SlideOver";
import CryptoTextBox from "../../CustomComponent/CustomCryptoTextBox";
import { useLocation } from "react-router-dom";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/mode-yaml";
import yaml from "js-yaml";
import ResizableBottomDrawer from "../../CustomComponent/ResizableBottomDrawer";
import lget from "lodash/get";
import CustomLoadingModal from "../../CustomComponent/CustomLoadingModal";

function Secrets() {
  const [fetching, setFetching] = React.useState(true);
  const [secrets, setSecrets] = React.useState([]);
  const { request } = React.useContext(ControllerContext);
  const { pushFeedback } = React.useContext(FeedbackContext);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSecret, setselectedSecret] = useState<any | null>(null);
  const [isBottomDrawerOpen, setIsBottomDrawerOpen] = useState(false);
  const [editorIsChanged, setEditorIsChanged] = React.useState(false);
  const [editorDataChanged, setEditorDataChanged] = React.useState<any>();
  const [yamlDump, setyamlDump] = useState<any>();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const secretName = params.get("secretName");

  const handleRowClick = (row: any) => {
    if (row.name) {
      fetchSecretItem(row.name);
    }
  };

  useEffect(() => {
    if (secretName && secrets) {
      const found = secrets.find((secret: any) => secret.name === secretName);
      if (found) {
        handleRowClick(found);
        setIsOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secretName, secrets]);

  async function fetchSecrets() {
    try {
      setFetching(true);
      const secretsItemsResponse = await request("/api/v3/secrets");
      if (!secretsItemsResponse.ok) {
        pushFeedback({
          message: secretsItemsResponse.statusText,
          type: "error",
        });
        setFetching(false);
        return;
      }
      const secretsItems = (await secretsItemsResponse.json()).secrets;
      setSecrets(secretsItems);
      setFetching(false);
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error" });
      setFetching(false);
    }
  }

  async function fetchSecretItem(secretName: string) {
    try {
      setFetching(true);
      const itemResponse = await request(`/api/v3/secrets/${secretName}`);
      if (!itemResponse.ok) {
        pushFeedback({ message: itemResponse.statusText, type: "error" });
        setFetching(false);
        return;
      }
      const responseItem = await itemResponse.json();
      setselectedSecret(responseItem);
      setIsOpen(true);
      setFetching(false);
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error" });
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchSecrets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditYaml = () => {
    if (!selectedSecret) return;
    const yamlObj = {
      apiVersion: "datasance.com/v3",
      kind: "Secret",
      metadata: {
        name: selectedSecret?.name,
      },
      spec: {
        type: selectedSecret?.type,
      },
      data: selectedSecret?.data,
    };
    const yamlString = yaml.dump(yamlObj, { noRefs: true, indent: 2 });
    setyamlDump(yamlString);
    setIsBottomDrawerOpen(true);
  };

  const parseSecret = async (doc: any) => {
    if (doc.apiVersion !== "datasance.com/v3") {
      return [
        {},
        `Invalid API Version ${doc.apiVersion}, current version is datasance.com/v3`,
      ];
    }
    if (doc.kind !== "Secret") {
      return [{}, `Invalid kind ${doc.kind}`];
    }
    if (!doc.metadata || !doc.data) {
      return [{}, "Invalid YAML format"];
    }
    const secret = {
      name: lget(doc, "metadata.name", lget(doc, "spec.name", undefined)),
      data: lget(doc, "data", {}),
    };

    return [secret];
  };

  async function handleYamlUpdate() {
    try {
      const parsed = yaml.load(editorDataChanged) as any;
      const [secret, err] = await parseSecret(parsed);
      if (err) {
        return pushFeedback({ message: err, type: "error" });
      }
      const res = await request(`/api/v3/secrets/${selectedSecret?.name}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(secret),
      });

      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: "error" });
      } else {
        pushFeedback({
          message: `${selectedSecret?.name} Updated`,
          type: "success",
        });
        setIsBottomDrawerOpen(false);
        setEditorIsChanged(false);
        setEditorDataChanged(null);
        setIsOpen(false);
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  }

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
      key: "type",
      header: "type",
      render: (row: any) => <span>{row.type || "-"}</span>,
    },
  ];
  const slideOverFields = [
    {
      label: "Secret Details",
      render: () => "",
      isSectionHeader: true,
    },
    {
      label: "Secret Name",
      render: (row: any) => row.name || "N/A",
    },
    {
      label: "Type",
      render: (row: any) => row.type || "N/A",
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
              return (
                <div key={index} className="py-3 flex flex-col">
                  <div className="text-sm font-medium text-gray-300 mb-1">
                    {key}
                  </div>
                  <div className="text-sm text-white break-all bg-gray-800 rounded px-2 py-1">
                    <CryptoTextBox
                      data={parsed}
                      mode={node.type === "tls" ? "encrypted" : "plain"}
                    />
                  </div>
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
            message="Fetching Secret Details"
            spinnerSize="lg"
            spinnerColor="text-green-500"
            overlayOpacity={60}
          />
        </>
      ) : (
        <>
          <div className="bg-gray-900 text-white overflow-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
              Secrets
            </h1>

            <CustomDataTable
              columns={columns}
              data={secrets}
              getRowKey={(row: any) => row.name}
            />
            <SlideOver
              open={isOpen}
              onClose={() => setIsOpen(false)}
              onEditYaml={handleEditYaml}
              title={selectedSecret?.name || "Secret Details"}
              data={selectedSecret}
              fields={slideOverFields}
              customWidth={600}
            />
          </div>
          <ResizableBottomDrawer
            open={isBottomDrawerOpen}
            isEdit={editorIsChanged}
            onClose={() => {
              setIsBottomDrawerOpen(false);
              setEditorIsChanged(false);
              setEditorDataChanged(null);
            }}
            onSave={() => handleYamlUpdate()}
            title={`${selectedSecret?.name} Secret`}
            showUnsavedChangesModal
            unsavedModalTitle="Changes Not Saved"
            unsavedModalMessage="Are you sure you want to exit? All unsaved changes will be lost."
            unsavedModalCancelLabel="Stay"
            unsavedModalConfirmLabel="Exit Anyway"
          >
            <AceEditor
              setOptions={{
                useWorker: false,
                wrap: true,
                tabSize: 2,
              }}
              mode="yaml"
              theme="tomorrow"
              defaultValue={yamlDump}
              showPrintMargin={false}
              onLoad={function (editor) {
                editor.renderer.setPadding(10);
                editor.renderer.setScrollMargin(10);
              }}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "4px",
              }}
              onChange={function editorChanged(editor: any) {
                setEditorIsChanged(true);
                setEditorDataChanged(editor);
              }}
            />
          </ResizableBottomDrawer>
        </>
      )}
    </>
  );
}

export default Secrets;
