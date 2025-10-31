import React, { useEffect, useState } from "react";
import CustomDataTable from "../../CustomComponent/CustomDataTable";
import { ControllerContext } from "../../ControllerProvider";
import { FeedbackContext } from "../../Utils/FeedbackContext";
import SlideOver from "../../CustomComponent/SlideOver";
import { format, formatDistanceToNow } from "date-fns";
import CryptoTextBox from "../../CustomComponent/CustomCryptoTextBox";
import { NavLink, useLocation } from "react-router-dom";
import CustomLoadingModal from "../../CustomComponent/CustomLoadingModal";
import { parseCertificate, parseCertificateAuthority } from "../../Utils/parseCertificateYaml";
import yaml from "js-yaml";
import { useTerminal } from "../../providers/Terminal/TerminalProvider";

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
  const [loading, setLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] =
    React.useState("Certificate Adding...");
  const { addYamlSession } = useTerminal();

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

  const handleEditYaml = () => {
    const yamlDump = {
      apiVersion: "datasance.com/v3",
      kind: "Certificate",
      metadata: {
        name: selectedCertificate?.name,
      },
      spec: {
        subject: selectedCertificate?.subject,
        hosts: selectedCertificate?.hosts,
        expiration: selectedCertificate?.expiration,
        ca: selectedCertificate?.ca,
      },
    };

    const yamlString = yaml.dump(yamlDump, { noRefs: true, indent: 2 });

    addYamlSession({
      title: `YAML: ${selectedCertificate?.name}`,
      content: yamlString,
      isDirty: false,
      onSave: async (content: string) => {
        try {
          const parsedDoc = yaml.load(content);

          const [certificateItem, err] = await parseCertificate(parsedDoc);

          if (err) {
            pushFeedback({ message: err, type: "error" });
            return;
          }

          await postCertificateItem(certificateItem, "PATCH");

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

          let successCount = 0;
          let errorCount = 0;

          for (const doc of docs) {
            if (!doc) {
              continue;
            }

            let parsedItem;
            let err;

            if ((doc as any).kind === "Certificate") {
              [parsedItem, err] = await parseCertificate(doc);
            } else if ((doc as any).kind === "CertificateAuthority") {
              [parsedItem, err] = await parseCertificateAuthority(doc);
            } else {
              err = `Invalid kind ${(doc as any).kind}, expected Certificate or CertificateAuthority`;
            }

            if (err) {
              console.error("Error parsing a document:", err);
              pushFeedback({ message: `Error processing item: ${err}`, type: "error" });
              errorCount++;
            } else {
              postCertificateItem(parsedItem, "POST");
              successCount++;
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
          pushFeedback({ message: "Could not parse the file. Check YAML syntax.", type: "error" });
        }
      };

      reader.onerror = function (evt) {
        pushFeedback({ message: evt, type: "error" });
      };

      reader.readAsText(file, "UTF-8");
    }
  };

  const postCertificateItem = async (item: any, method?: string) => {
    debugger;

    let newItem;

    if (typeof item === 'object' && item !== null) {
      newItem = { ...item };
    } else {
      console.error("Invalid data type passed to postCertificateItem:", typeof item);
      pushFeedback({ message: "Invalid data.", type: "error" });
      setLoading(false);
      return;
    }

    setLoadingMessage("Certificate Adding...");
    setLoading(true);

    const response = await request(
      `/api/v3/certificates${method === "PATCH" ? "/" + newItem.name : ''}`,
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
      pushFeedback({ message: "Certificate Added!", type: "success" });
      fetchCertificates();
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
              uploadDropzone
              uploadFunction={handleYamlUpload}
            />

            <SlideOver
              open={isOpen}
              onClose={() => setIsOpen(false)}
              onEditYaml={handleEditYaml}
              title={selectedCertificate?.name || "Certificate Details"}
              data={selectedCertificate}
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
          </div>
        </>
      )}
    </>
  );
}

export default Certificates;
