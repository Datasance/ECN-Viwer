import React, { useEffect, useState } from "react";
import CustomDataTable from "../../CustomComponent/CustomDataTable";
import { ControllerContext } from "../../ControllerProvider";
import { FeedbackContext } from "../../Utils/FeedbackContext";
import SlideOver from "../../CustomComponent/SlideOver";
import CustomLoadingModal from "../../CustomComponent/CustomLoadingModal";
import { useLocation } from "react-router-dom";
import yaml from "js-yaml";
import lget from "lodash/get";
import { useTerminal } from "../../providers/Terminal/TerminalProvider";
import { parseRegistries } from "../../Utils/parseRegistriesYaml";

function Registries() {
  const [fetching, setFetching] = React.useState(true);
  const [registries, setRegistries] = React.useState([]);
  const { request } = React.useContext(ControllerContext);
  const { pushFeedback } = React.useContext(FeedbackContext);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRegistry, setSelectedRegistry] =
    useState<any | null>(null);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const registryId = params.get("registryId");
  const { addYamlSession } = useTerminal();

  const handleRowClick = (row: any) => {
    setSelectedRegistry(row);
    setIsOpen(true);
  };

  async function fetchRegistries() {
    try {
      setFetching(true);
      const registriesResponse = await request(
        "/api/v3/registries",
      );
      if (!registriesResponse.ok) {
        pushFeedback({
          message: registriesResponse.statusText,
          type: "error",
        });
        setFetching(false);
        return;
      }
      const registries = (await registriesResponse.json()).registries;
      setRegistries(registries);
      setFetching(false);
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error" });
      setFetching(false);
    }
  }


  useEffect(() => {
    fetchRegistries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (registryId && registries) {
      const found = registries.find((item: any) => item.id.toString() === registryId);
      if (found) {
        handleRowClick(found);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registryId, registries]);

  const handleEditYaml = () => {
    const name = selectedRegistry?.url.replace(/\./g, '-') || 'untitled';

    const yamlObj = {
      apiVersion: "datasance.com/v3",
      kind: "Registries",
      metadata: {
        name: name,
      },
      spec: {
        immutable: selectedRegistry?.immutable || false,
      },
      data: selectedRegistry,
    };

    const yamlString = yaml.dump(yamlObj, {
      noRefs: true,
      indent: 2,
      lineWidth: -1
    });

    addYamlSession({
      title: `YAML: ${name}`,
      content: yamlString,
      isDirty: false,
      onSave: async (content: string) => {
        try {
          const parsedDoc = yaml.load(content);
          const [registry, err] = await parseRegistries(parsedDoc);

          if (err) {
            pushFeedback({ message: err, type: "error" });
            return;
          }

          await handleYamlUpdate(registry, "PATCH");
        } catch (e: any) {
          pushFeedback({ message: e.message, type: "error", uuid: "error" });
        }
      },
    });
  };

  async function handleYamlUpdate(registries: any, method?: string) {
    try {
      const res = await request(
        `/api/v3/registries/${method === "PATCH" ? "/" + selectedRegistry.id : ''}`,
        {
          method: method,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(registries),
        }
      );

      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: "error" });
      } else {
        pushFeedback({
          message: `${selectedRegistry.id || "New"} ${method === "POST" ? "Added" : "Updated"}`,
          type: "success",
        });
        setIsOpen(false);
      }
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  }

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

            const [registry, err] = await parseRegistries(doc);

            if (err) {
              console.error("Error parsing a document:", err);
              pushFeedback({ message: `Error processing item: ${err}`, type: "error" });
              errorCount++;
            } else {
              try {
                await handleYamlUpdate(registry, "POST");
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

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (row: any) => <span>{row.id || "-"}</span>,
    },
    {
      key: "url",
      header: "URL",
      render: (row: any) => (
        <div
          className="cursor-pointer text-blue-400 hover:underline"
          onClick={() => handleRowClick(row)}
        >
          {row.url || "-"}
        </div>
      ),
    },
    {
      key: "isPublic",
      header: "PRIVATE",
      render: (row: any) => <span>{row.isPublic ? "false" : "true"}</span>,
    },
  ];

  const slideOverFields = [
    {
      label: "ID",
      render: (row: any) => row.id || "N/A",
    },
    {
      label: "URL",
      render: (row: any) => row.url || "N/A",
    },
    {
      label: "Username",
      render: (row: any) => row.username || "N/A",
    },
    {
      label: "User Email",
      render: (row: any) => row.userEmail || "N/A",
    },
    {
      label: "Private",
      render: (row: any) => <span>{row.isPublic ? "false" : "true"}</span>,
    },
  ];

  return (
    <>
      {fetching ? (
        <>
          <CustomLoadingModal
            open={true}
            message="Fetching Registries"
            spinnerSize="lg"
            spinnerColor="text-green-500"
            overlayOpacity={60}
          />
        </>
      ) : (
        <>
          <div className="bg-gray-900 text-white overflow-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
              Registries
            </h1>

            <CustomDataTable
              columns={columns}
              data={registries}
              getRowKey={(row: any) => row.id}
              uploadDropzone
              uploadFunction={handleYamlParse}
            />
          </div>
        </>
      )}
      <SlideOver
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          selectedRegistry?.url ||
          "Registry Details"
        }
        data={selectedRegistry}
        fields={slideOverFields}
        customWidth={600}
        onEditYaml={handleEditYaml}
      />
    </>
  );
}

export default Registries;
