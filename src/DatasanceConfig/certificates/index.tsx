import React, { useEffect, useState } from "react";
import CustomDataTable from "../../CustomComponent/CustomDataTable";
import { ControllerContext } from "../../ControllerProvider";
import { FeedbackContext } from "../../Utils/FeedbackContext";
import SlideOver from "../../CustomComponent/SlideOver";
import { format, formatDistanceToNow } from "date-fns";
import CryptoTextBox from "../../CustomComponent/CustomCryptoTextBox";
import { NavLink, useLocation } from "react-router-dom";
import CustomLoadingModal from "../../CustomComponent/CustomLoadingModal";

function Certificates() {
  const [fetching, setFetching] = React.useState(true);
  const [certificates, setCertificates] = React.useState([]);
  const { request } = React.useContext(ControllerContext);
  const { pushFeedback } = React.useContext(FeedbackContext);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(
    null,
  );
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const certificateName = params.get("name");

  const handleRowClick = (row: any) => {
    if (row.name) {
      fetchCertificateItem(row.name);
    }
  };

  useEffect(() => {
    if (certificateName && certificates) {
      const found = certificates.find(
        (cert: any) => cert.name === certificateName,
      );
      if (found) {
        handleRowClick(found);
        setIsOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificateName, certificates]);

  async function fetchCertificates() {
    try {
      setFetching(true);
      const certificatesItemsResponse = await request("/api/v3/certificates");
      if (!certificatesItemsResponse.ok) {
        pushFeedback({
          message: certificatesItemsResponse.statusText,
          type: "error",
        });
        setFetching(false);
        return;
      }
      const certificatesItems = (await certificatesItemsResponse.json())
        .certificates;
      setCertificates(certificatesItems);
      setFetching(false);
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error" });
      setFetching(false);
    }
  }

  async function fetchCertificateItem(certificateName: string) {
    try {
      setFetching(true);
      const itemResponse = await request(
        `/api/v3/certificates/${certificateName}`,
      );
      if (!itemResponse.ok) {
        pushFeedback({ message: itemResponse.statusText, type: "error" });
        setFetching(false);
        return;
      }
      const responseItem = await itemResponse.json();
      setSelectedCertificate(responseItem);
      setIsOpen(true);
      setFetching(false);
    } catch (e: any) {
      pushFeedback({ message: e.message, type: "error" });
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      key: "isCA",
      header: "isCA",
      render: (row: any) => <span>{row.isCA.toString()}</span>,
    },
    {
      key: "caName",
      header: "ca name",
      render: (row: any) => <span>{row.caName || "-"}</span>,
    },
    {
      key: "isExpired",
      header: "Is Expired",
      render: (row: any) => <span>{row.isExpired.toString()}</span>,
    },
  ];

  const slideOverFields = [
    {
      label: "Certificate Details",
      render: () => "",
      isSectionHeader: true,
    },
    {
      label: "Certificate Name",
      render: (row: any) => row.name || "N/A",
    },
    {
      label: "Ca Name",
      render: (row: any) => {
        if (!row.caName) return <span className="text-gray-400">N/A</span>;
        return (
          <NavLink
            to={`/config/certificates?name=${encodeURIComponent(row.caName)}`}
            className="text-blue-400 underline cursor-pointer"
          >
            {row.caName}
          </NavLink>
        );
      },
    },
    {
      label: "Is CA",
      render: (row: any) => row.isCA.toString() || "N/A",
    },
    {
      label: "Is Expired",
      render: (row: any) => row.isExpired.toString() || "N/A",
    },
    {
      label: "Serial Number",
      render: (row: any) => row.serialNumber || "N/A",
    },
    {
      label: "Subject",
      render: (row: any) => row.subject || "N/A",
    },
    {
      label: "Hosts",
      render: (row: any) => row.hosts || "N/A",
    },
    {
      label: "Valid From",
      render: (row: any) => {
        if (!row.validFrom) return "N/A";
        const date = new Date(row.validFrom);
        return (
          <>
            {formatDistanceToNow(date, { addSuffix: true })} <br />
            <span className="text-xs text-gray-400">
              {format(date, "PPpp")}
            </span>
          </>
        );
      },
    },
    {
      label: "Valid To",
      render: (row: any) => {
        if (!row.validTo) return "N/A";
        const date = new Date(row.validTo);
        return (
          <>
            {formatDistanceToNow(date, { addSuffix: true })} <br />
            <span className="text-xs text-gray-400">
              {format(date, "PPpp")}
            </span>
          </>
        );
      },
    },
    {
      label: "Days Remaining",
      render: (row: any) => row.daysRemaining || "N/A",
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
                    {key}:
                  </div>
                  <div className="text-sm text-white break-all bg-gray-800 rounded px-2 py-1">
                    <CryptoTextBox data={parsed} mode={"plain"} />
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
            message="Fetching Certificates"
            spinnerSize="lg"
            spinnerColor="text-green-500"
            overlayOpacity={60}
          />
        </>
      ) : (
        <>
          <div className="bg-gray-900 text-white overflow-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-white border-b border-gray-700 pb-2">
              Certificates
            </h1>

            <CustomDataTable
              columns={columns}
              data={certificates}
              getRowKey={(row: any) => row.name}
            />

            <SlideOver
              open={isOpen}
              onClose={() => setIsOpen(false)}
              title={selectedCertificate?.name || "Certificate Details"}
              data={selectedCertificate}
              fields={slideOverFields}
              customWidth={600}
            />
          </div>
        </>
      )}
    </>
  );
}

export default Certificates;
