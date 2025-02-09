import React, { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import YAML from "js-yaml";

const SwaggerDoc = () => {
    const [swaggerDocument, setSwaggerDocument] = useState(null);

    useEffect(() => {
        const fetchSwaggerDoc = async () => {
            try {
                const response = await fetch("/swagger.yaml");
                const yamlText = await response.text();
                const document = YAML.load(yamlText);
                if (!document.components) document.components = {};
                if (!document.components.securitySchemes)
                    document.components.securitySchemes = {};
                document.components.securitySchemes.userToken = {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                };
                const href = window.location.href;
                const hashIndex = href.indexOf("#");
                const queryString = hashIndex !== -1 ? href.substring(hashIndex + 2) : "";
                const queryParams = new URLSearchParams(queryString.split("?")[1]);
                const userToken = queryParams.get("userToken") || "";
                const baseUrl = queryParams.get("baseUrl") || "http://localhost:51121/api/v3";
                document.servers = [
                    {
                        url: baseUrl,
                    },
                ];
                document.security = userToken
                    ? [
                          {
                              userToken: [],
                          },
                      ]
                    : [];

                setSwaggerDocument(document);

                if (userToken) {
                    window.ui?.authActions?.authorize({
                        userToken: {
                            name: "userToken",
                            schema: {
                                type: "http",
                                in: "header",
                                name: "Authorization",
                                description: "Bearer Token",
                            },
                            value: `Bearer ${userToken}`,
                        },
                    });
                }
            } catch (error) {
                console.error("Swagger YAML Failed:", error);
            }
        };

        fetchSwaggerDoc();
    }, []);

    if (!swaggerDocument) {
        return <div>Loading...</div>;
    }

    return (
        <div id="swagger-container">
            <SwaggerUI
                spec={swaggerDocument}
                persistAuthorization={true}
                requestInterceptor={(request) => {
                    const href = window.location.href;
                    const hashIndex = href.indexOf("#");
                    const queryString = hashIndex !== -1 ? href.substring(hashIndex + 1) : "";
                    const queryParams = new URLSearchParams(queryString.split("?")[1]);
                    const userToken = queryParams.get("userToken") || "";
                    if (userToken) {
                        request.headers["Authorization"] = `Bearer ${userToken}`;
                    }
                    return request;
                }}
                onComplete={(system) => {
                    const href = window.location.href;
                    const hashIndex = href.indexOf("#");
                    const queryString = hashIndex !== -1 ? href.substring(hashIndex + 1) : "";
                    const queryParams = new URLSearchParams(queryString.split("?")[1]);
                    const userToken = queryParams.get("userToken") || "";
                    if (userToken) {
                        system.authActions.authorize({
                            userToken: {
                                name: "userToken",
                                schema: {
                                    type: "http",
                                    in: "header",
                                    name: "Authorization",
                                    description: "Bearer Token",
                                },
                                value: `Bearer ${userToken}`,
                            },
                        });
                    }
                }}
            />
        </div>
    );
};

export default SwaggerDoc;
