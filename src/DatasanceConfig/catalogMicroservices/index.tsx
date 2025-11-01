import React, { useEffect, useState } from "react";
import CustomDataTable from "../../CustomComponent/CustomDataTable";
import { ControllerContext } from "../../ControllerProvider";
import { FeedbackContext } from "../../Utils/FeedbackContext";
import SlideOver from "../../CustomComponent/SlideOver";
import CustomLoadingModal from "../../CustomComponent/CustomLoadingModal";
import { useLocation, NavLink } from "react-router-dom";
import yaml from "js-yaml";
import { parseCatalogMicroservice } from "../../Utils/parseCatalogMicroservice";
import { useTerminal } from "../../providers/Terminal/TerminalProvider";

function CatalogMicroservices() {
  const [fetching, setFetching] = React.useState(true);
  const [catalog, setCatalog] = React.useState([]);
  const { request } = React.useContext(ControllerContext);
  const { pushFeedback } = React.useContext(FeedbackContext);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCatalogMicroservice, setselectedCatalogMicroservice] =
    useState<any | null>(null);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const catalogItemId = params.get("catalogItemid");
  const { addYamlSession } = useTerminal();

  const [loading, setLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] =
    React.useState("Catalog Adding...");

  const handleRowClick = (row: any) => {
    if (row.id) {
      fetchCatalogItem(row.id);
    }
  };

  async function fetchCatalog() {
    try {
      setFetching(true);
      const catalogItemsResponse = await request(
        "/api/v3/catalog/microservices",
      );
      if (!catalogItemsResponse.ok) {
        pushFeedback({
          message: catalogItemsResponse.statusText,
          type: "error",
        });
        setFetching(false);
        return;
      }
      const catalogItems = (await catalogItemsResponse.json()).catalogItems;
      setCatalog(catalogItems);
      setFetching(false);
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error" });
      setFetching(false);
    }
  }

  async function fetchCatalogItem(catalogId: string) {
    try {
      setFetching(true);
      const catalogItemResponse = await request(
        `/api/v3/catalog/microservices/${catalogId}`,
      );
      if (!catalogItemResponse.ok) {
        pushFeedback({
          message: catalogItemResponse.statusText,
          type: "error",
        });
        setFetching(false);
        return;
      }
      const catalogItems = await catalogItemResponse.json();
      setselectedCatalogMicroservice(catalogItems);
      setIsOpen(true);
      setFetching(false);
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error" });
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (catalogItemId && catalog) {
      const found = catalog.find((item: any) => item.id.toString() === catalogItemId);
      if (found) {
        handleRowClick(found);
        setIsOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogItemId, catalog]);

  const handleEditYaml = () => {
    if (!selectedCatalogMicroservice) return;

    const yamlObj = {
      apiVersion: "datasance.com/v3",
      kind: "CatalogMicroservice",
      metadata: {
        name: selectedCatalogMicroservice.name,
      },
      spec: {
        description: selectedCatalogMicroservice.description,
        category: selectedCatalogMicroservice.category,
        images: selectedCatalogMicroservice.images,
        publisher: selectedCatalogMicroservice.publisher,
        diskRequired: selectedCatalogMicroservice.diskRequired,
        ramRequired: selectedCatalogMicroservice.ramRequired,
        picture: selectedCatalogMicroservice.picture,
        isPublic: selectedCatalogMicroservice.isPublic,
        registryId: selectedCatalogMicroservice.registryId,
        inputType: selectedCatalogMicroservice.inputType,
        outputType: selectedCatalogMicroservice.outputType,
        configExample: selectedCatalogMicroservice.configExample,
      },
    };

    const yamlString = yaml.dump(yamlObj, {
      noRefs: true,
      indent: 2,
      lineWidth: -1
    });

    addYamlSession({
      title: `YAML: ${selectedCatalogMicroservice.name}`,
      content: yamlString,
      isDirty: false,
      onSave: async (content: string) => {
        try {
          const parsedDoc = yaml.load(content);
          const [catalogItem, err] = await parseCatalogMicroservice(parsedDoc);

          if (err) {
            pushFeedback({ message: err, type: "error" });
            return;
          }

          await postCatalogItem(catalogItem, "PATCH");
        } catch (e: any) {
          pushFeedback({ message: e.message, type: "error", uuid: "error" });
        }
      },
    });
  };


  const handleYamlUpload = async (item: any) => {
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

          

          for (const doc of docs) {
            if (!doc) {
              continue;
            }

            const [catalogItem, err] = await parseCatalogMicroservice(doc);

            if (err) {
              console.error("Error parsing a document:", err);
              pushFeedback({ message: `Error processing item: ${err}`, type: "error" });
              
            } else {
              await postCatalogItem(catalogItem, "POST");
              
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

  const postCatalogItem = async (item: any, method?: string) => {
    const newItem = { ...item };
    setLoadingMessage(method === "PATCH" ? "Catalog Updating..." : "Catalog Adding...");
    setLoading(true);

    const response = await request(
      `/api/v3/catalog/microservices${method === "PATCH" ? "/" + newItem.name : ''}`,
      {
        method: method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItem),
      },
    );
    if (response?.ok) {
      pushFeedback({
        message: `Catalog ${method === "PATCH" ? "Updated" : "Added"}!`,
        type: "success"
      });
      fetchCatalog();
      setLoading(false);
    } else {
      pushFeedback({ message: response?.statusText || "Something went wrong", type: "error" });
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (row: any) => <span>{row.id || "-"}</span>,
    },
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
      key: "description",
      header: "Description",
      render: (row: any) => <span>{row.description || "-"}</span>,
    },
    {
      key: "registryId",
      header: "Registry",
      render: (row: any) => (
        <span>{row.registryId === 1 ? "Remote" : "-"}</span>
      ),
    },
    {
      key: "images",
      header: "x86",
      render: (row: any) => (
        <span>
          {row.images.find((x: any) => x.fogTypeId === 1)?.containerImage}
        </span>
      ),
    },
    {
      key: "images",
      header: "ARM",
      render: (row: any) => (
        <span>
          {row.images.find((x: any) => x.fogTypeId === 2)?.containerImage}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (row: any) => <span>{row.category || "-"}</span>,
    },
  ];

  const slideOverFields = [
    {
      label: "Name",
      render: (row: any) => row.name || "N/A",
    },
    {
      label: "Category",
      render: (row: any) => row.category || "N/A",
    },
    {
      label: "Config Example",
      render: (row: any) => row.configExample || "N/A",
    },
    {
      label: "Description",
      render: (row: any) => row.description || "N/A",
    },
    {
      label: "Disk Required",
      render: (row: any) => (row.diskRequired === 0 ? "false" : "true"),
    },
    {
      label: "Input Type",
      render: (row: any) => row.inputType || "N/A",
    },
    {
      label: "Is Public",
      render: (row: any) => row.isPublic.toString() || "N/A",
    },
    {
      label: "Output Type",
      render: (row: any) => row.outputType || "N/A",
    },
    {
      label: "Picture",
      render: (row: any) => row.picture || "N/A",
    },
    {
      label: "publisher",
      render: (row: any) => row.publisher || "N/A",
    },
    {
      label: "Ram Required",
      render: (row: any) => row.ramRequired.toString() || "N/A",
    },
    {
      label: "Registry Id",
      render: (row: any) => {
        if (!row?.registryId) return <span className="text-gray-400">N/A</span>;
        return (
          <NavLink
            to={`/config/registries?registryId=${encodeURIComponent(row.registryId)}`}
            className="text-blue-400 underline cursor-pointer"
          >
            {row.registryId}
          </NavLink>
        );
      },
    },
    {
      label: "Images",
      render: () => "",
      isSectionHeader: true,
    },
    {
      label: "",
      isFullSection: true,
      render: (node: any) => {
        const images = node?.images || [];

        if (!Array.isArray(images) || images.length === 0) {
          return (
            <div className="text-sm text-gray-400">No images available.</div>
          );
        }

        const tableData = images.map((route: any, index: number) => ({
          fogTypeId: route.fogTypeId || "-",
          containerImage: route.containerImage || "-",
        }));

        const columns = [
          {
            key: "fogTypeId",
            header: "Fog Type Id",
            formatter: ({ row }: any) => (
              <span className="text-white">{row.fogTypeId}</span>
            ),
          },
          {
            key: "containerImage",
            header: "Container Image",
            formatter: ({ row }: any) => (
              <span className="text-white">{row.containerImage}</span>
            ),
          },
        ];

        return (
          <CustomDataTable
            columns={columns}
            data={tableData}
            getRowKey={(row: any) => row.key}
          />
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
            message="Fetching Catalog Microservices"
            spinnerSize="lg"
            spinnerColor="text-green-500"
            overlayOpacity={60}
          />
        </>
      ) : (
        <>
          <div className="bg-gray-900 text-white overflow-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
              Catalog Microservices
            </h1>

            <CustomDataTable
              columns={columns}
              data={catalog}
              getRowKey={(row: any) => row.id}
              uploadDropzone
              uploadFunction={handleYamlUpload}
            />
          </div>
        </>
      )}
      <SlideOver
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onEditYaml={handleEditYaml}
        title={
          selectedCatalogMicroservice?.name ||
          "Catalog Microservice Details"
        }
        data={selectedCatalogMicroservice}
        fields={slideOverFields}
        customWidth={600}
      />
      <CustomLoadingModal
        open={loading}
        message={loadingMessage}
        spinnerSize="lg"
        spinnerColor="text-green-500"
        overlayOpacity={60}
      />
    </>
  );
}

export default CatalogMicroservices;
