import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

type CustomSSHTerminalProps = {
    socketUrl: string;
    authToken?: string;
    className?: string;
};

const CustomSSHTerminal: React.FC<CustomSSHTerminalProps> = ({
    socketUrl,
    authToken,
    className,
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const termRef = useRef<Terminal | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const fitRef = useRef<FitAddon | null>(null);

    useEffect(() => {
        const term = new Terminal({ cursorBlink: true, fontSize: 13, convertEol: true });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        fitRef.current = fitAddon;

        if (containerRef.current) {
            term.open(containerRef.current);
            fitAddon.fit();
            term.focus();
        }
        termRef.current = term;

        const wsUrl = authToken ? `${socketUrl}?token=${authToken}` : socketUrl;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => term.writeln("Connected");
        ws.onmessage = (evt) => {
            if (typeof evt.data === "string") term.write(evt.data);
            else if (evt.data instanceof Blob) evt.data.text().then(txt => term.write(txt));
        };
        ws.onclose = (evt) => {
            term.writeln(`\r\n Disconnected (code: ${evt.code}${evt.reason ? `, reason: ${evt.reason}` : ""})`);
        };
        ws.onerror = (evt) => {
            term.writeln("\r\n Connection error");
            console.error("WebSocket error:", evt);
        };

        const inputListener = term.onData((data) => {
            term.write(data);
            if (ws.readyState === WebSocket.OPEN) ws.send(data);
        });

        let resizeTimeout: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => fitRef.current?.fit(), 50);
        };

        const ro = new ResizeObserver(handleResize);
        if (containerRef.current) ro.observe(containerRef.current);
        window.addEventListener("resize", handleResize);

        return () => {
            inputListener.dispose();
            ro.disconnect();
            window.removeEventListener("resize", handleResize);
            ws.close();
            term.dispose();
        };
    }, [socketUrl, authToken]);

    return (
        <div
            className={className}
            style={{ height: "100%", width: "100%", background: "black", display: "flex" }}
            onClick={() => termRef.current?.focus()}
        >
            <div ref={containerRef} style={{ flex: 1 }} />
        </div>
    );
};

export default CustomSSHTerminal;
