import React, { useEffect, useState } from "react";
import CustomDataTable from "../../CustomComponent/CustomDataTable";
import { ControllerContext } from "../../ControllerProvider";
import { FeedbackContext } from "../../Utils/FeedbackContext";
import SlideOver from "../../CustomComponent/SlideOver";
import CustomLoadingModal from "../../CustomComponent/CustomLoadingModal";
import { useLocation } from "react-router-dom";

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
      />
    </>
  );
}

export default Registries;
