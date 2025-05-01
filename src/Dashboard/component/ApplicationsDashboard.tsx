import React, { useEffect, useState } from "react";
import ApexCharts from "react-apexcharts";

const ApplicationDashboard = ({ applications, title }: any) => {
    const [chartData, setChartData] = useState<any>({});

    // Fonksiyon: Bayt cinsinden veriyi daha okunabilir bir formata dönüştür
    const convertBytesToGB = (bytes: number) => {
        return (bytes / (1024 ** 3)).toFixed(2); // GB cinsine dönüştürüp iki ondalıklı sayıya yuvarla
    };

    useEffect(() => {
        if (!applications || applications.length === 0) return;
    
        const allMicroservices = applications.flatMap((app: any) =>
            app.microservices.map((micro: any) => ({
                name: micro.name,
                appName: app.name,
                cpuUsage: micro.status.cpuUsage,
                memoryUsage: convertBytesToGB(micro.status.memoryUsage),
            }))
        );
    
        const microserviceNames = allMicroservices.map((m:any) => m.name);
    
        const uniqueMicroservices = [...new Set(microserviceNames)];
    
        const cpuUsageData = applications.map((app: any) => ({
            name: app.name,
            data: uniqueMicroservices.map((msName) => {
                const micro = app.microservices.find((m: any) => m.name === msName);
                return micro ? micro.status.cpuUsage : 0;
            }),
        }));
    
        const memoryUsageData = applications.map((app: any) => ({
            name: app.name,
            data: uniqueMicroservices.map((msName) => {
                const micro = app.microservices.find((m: any) => m.name === msName);
                return micro ? convertBytesToGB(micro.status.memoryUsage) : 0;
            }),
        }));
    
        setChartData({
            cpuUsage: {
                series: cpuUsageData,
                options: {
                    chart: {
                        type: 'bar',
                        height: 350,
                        background: '#333',
                    },
                    xaxis: {
                        categories: uniqueMicroservices,
                        labels: {
                            style: {
                                colors: '#fff',
                            },
                            formatter: (value: string) => {
                                return value.length > 10 ? value.substring(0, 10) + '...' : value;
                            },
                        },
                    },
                    tooltip: {
                        x: {
                            formatter: (val: string) => val,
                        },
                    },
                    title: {
                        text: 'CPU Usage per Microservice',
                        align: 'left',
                        style: {
                            color: '#fff',
                        },
                    },
                    theme: {
                        mode: 'dark' as 'dark',
                        palette: 'palette1',
                    },
                },
            },
            memoryUsage: {
                series: memoryUsageData,
                options: {
                    chart: {
                        type: 'bar',
                        height: 350,
                        background: '#333',
                    },
                    xaxis: {
                        categories: uniqueMicroservices,
                        labels: {
                            style: {
                                colors: '#fff',
                            },
                            formatter: (value: string) => {
                                return value.length > 10 ? value.substring(0, 10) + '...' : value;
                            },
                        },
                    },
                    tooltip: {
                        x: {
                            formatter: (val: string) => val,
                        },
                    },
                    title: {
                        text: 'Memory Usage per Microservice (GB)',
                        align: 'left',
                        style: {
                            color: '#fff',
                        },
                    },
                    theme: {
                        mode: 'dark' as 'dark',
                        palette: 'palette1',
                    },
                },
            },
        });
    }, [applications]);
    

    if (applications && applications.length === 0) return <div>Loading...</div>;

    // Çart verisi henüz yüklenmemişse, bir uyarı mesajı gösterelim
    if (!chartData.cpuUsage || !chartData.memoryUsage) return <div>Loading charts...</div>;

    return (
        <div className="bg-gray-800 p-6 rounded-xl">
            <h1 className="text-3xl font-bold text-white mb-6 text-start">
                {`${applications?.length} ${title}${applications?.length > 1 ? "s" : ""}`}
            </h1>

            <div className="chart-container flex justify-between gap-6">
                <div id="cpu-usage-chart" className="w-full md:w-1/2">
                    <ApexCharts
                        options={chartData.cpuUsage.options}
                        series={chartData.cpuUsage.series}
                        type="bar"
                        height={350}
                    />
                </div>

                <div id="memory-usage-chart" className="w-full md:w-1/2">
                    <ApexCharts
                        options={chartData.memoryUsage.options}
                        series={chartData.memoryUsage.series}
                        type="bar"
                        height={350}
                    />
                </div>
            </div>
        </div>
    );

};

export default ApplicationDashboard;
