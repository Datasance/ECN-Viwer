import React, { useEffect, useState } from "react";
import CustomDataTable from "../../CustomComponent/CustomDataTable";
import { ControllerContext } from "../../ControllerProvider";
import { FeedbackContext } from "../../Utils/FeedbackContext";
import SlideOver from "../../CustomComponent/SlideOver";
import CryptoTextBox from "../../CustomComponent/CustomCryptoTextBox";
import { useLocation } from "react-router-dom";
import "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/mode-yaml";
import yaml from "js-yaml";
import CustomLoadingModal from "../../CustomComponent/CustomLoadingModal";
import UnsavedChangesModal from "../../CustomComponent/UnsavedChangesModal";
import { useTerminal } from "../../providers/Terminal/TerminalProvider";
import { parseSecret } from "../../Utils/parseSecretYaml";

function Secrets() {
  const [fetching, setFetching] = React.useState(true);
  const [secrets, setSecrets] = React.useState([]);
  const { request } = React.useContext(ControllerContext);
  const { pushFeedback } = React.useContext(FeedbackContext);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSecret, setselectedSecret] = useState<any | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const { addYamlSession } = useTerminal();
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
          message: secretsItemsResponse.message,
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
        pushFeedback({ message: itemResponse.message, type: "error" });
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

    addYamlSession({
      title: `YAML: ${selectedSecret?.name}`,
      content: yamlString,
      isDirty: false,
      onSave: async (content: string) => {
        try {
          const parsedDoc = yaml.load(content);
          const [secret, err] = await parseSecret(parsedDoc);

          if (err) {
            pushFeedback({ message: err, type: "error" });
            return;
          }

          await handleYamlUpdate(secret, "PATCH");
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
            pushFeedback({
              message: "Could not parse the file: Invalid YAML format",
              type: "error",
            });
            return;
          }

          for (const doc of docs) {
            if (!doc) {
              continue;
            }

            const [secret, err] = await parseSecret(doc);

            if (err) {
              console.error("Error parsing a document:", err);
              pushFeedback({
                message: `Error processing item: ${err}`,
                type: "error",
              });
            } else {
              try {
                await handleYamlUpdate(secret, "POST");
              } catch (e) {
                console.error("Error updating a document:", e);
              }
            }
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

  async function handleYamlUpdate(secret: any, method?: string) {
    try {
      const name = secret.name;

      const res = await request(
        `/api/v3/secrets${method === "PATCH" ? `/${name}` : ""}`,
        {
          method: method,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(secret),
        },
      );

      if (!res.ok) {
        pushFeedback({ message: res.message, type: "error" });
      } else {
        pushFeedback({
          message: `${name} ${method === "POST" ? "Added" : "Updated"}`,
          type: "success",
        });
        setIsOpen(false);
        fetchSecrets();
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  }

  const handleDeleteSecret = async () => {
    try {
      if (!selectedSecret?.name) {
        pushFeedback({ message: "No secret selected", type: "error" });
        return;
      }

      const res = await request(`/api/v3/secrets/${selectedSecret.name}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        pushFeedback({
          message: res.message,
          type: "error",
        });
      } else {
        pushFeedback({
          message: `Secret ${selectedSecret.name} deleted`,
          type: "success",
        });
        setShowDeleteConfirmModal(false);
        setIsOpen(false);
        setselectedSecret(null);
        fetchSecrets();
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
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
              uploadDropzone
              uploadFunction={handleYamlParse}
            />
            <SlideOver
              open={isOpen}
              onClose={() => setIsOpen(false)}
              onDelete={() => setShowDeleteConfirmModal(true)}
              onEditYaml={handleEditYaml}
              title={selectedSecret?.name || "Secret Details"}
              data={selectedSecret}
              fields={slideOverFields}
              customWidth={600}
            />

            <UnsavedChangesModal
              open={showDeleteConfirmModal}
              onCancel={() => setShowDeleteConfirmModal(false)}
              onConfirm={handleDeleteSecret}
              title={`Deleting Secret ${selectedSecret?.name}`}
              message={
                "This action will remove the secret from the system. If any Volume Mounts/Certificates are using this secret, they will be deleted and If any microservices are using this secret, they will need to be updated to use a different secret. This is not reversible."
              }
              cancelLabel={"Cancel"}
              confirmLabel={"Delete"}
            />
          </div>
        </>
      )}
    </>
  );
}

export default Secrets;
