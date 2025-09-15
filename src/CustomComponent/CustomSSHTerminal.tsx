import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import * as msgpack from "@ygoe/msgpack";

type CustomSSHTerminalProps = {
    socketUrl: string;
    authToken?: string;
    className?: string;
};

type Message = {
    type: number;
    data: Uint8Array;
    microserviceUuid: string;
    execId: string;
    timestamp: number;
};

const MessageTypeControl = 1;
const MessageTypeClose = 2;
const MessageTypeActivation = 3;
const MessageTypeStdin = 4;
const MessageTypeStdout = 5;
const MessageTypeStderr = 6;

const errorMessages: Record<string, string> = {
    "No available exec session": "No available exec session for this agent or microservice...",
    "Microservice has already active exec session": "Another user is already connected...",
    "Timeout waiting for agent connection": "Timeout waiting for agent connection...",
    "Authentication failed": "Authentication failed.",
    "Microservice is not running": "Microservice is not running.",
    "Microservice exec is not enabled": "Microservice exec is not enabled.",
    "Microservice already has an active session": "Another user is already connected.",
    "Insufficient permissions": "Insufficient permissions.",
    "Only SRE can access system microservices": "Only SRE can access system microservices.",
};

function formatWebSocketError(err: string) {
    if (err.includes("close 1008")) {
        for (const key in errorMessages) if (err.includes(key)) return errorMessages[key];
        return "Policy violation: Access denied";
    }
    if (err.includes("close 1006")) return "Connection lost unexpectedly";
    if (err.includes("close 1009")) return "Message too large";
    if (err.includes("close 1011")) return "Server error occurred";
    if (err.includes("failed to connect")) return "Failed to connect to server";
    if (err.includes("use of closed network connection")) return "Connection was closed";
    return err;
}

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
        ws.binaryType = "arraybuffer";
        wsRef.current = ws;

        ws.onopen = () => term.writeln("Connected");
        ws.onmessage = (evt) => {
            if (evt.data instanceof ArrayBuffer) {
                try {
                    const decoded = msgpack.deserialize(new Uint8Array(evt.data)) as Message;
                    if (decoded.type === MessageTypeStdout || decoded.type === MessageTypeStderr) {
                        term.write(new TextDecoder().decode(decoded.data));
                    }
                    if (decoded.type === MessageTypeControl) {
                        term.writeln(`\r\n [Control] ${new TextDecoder().decode(decoded.data)}`);
                    }
                    if (decoded.type === MessageTypeClose) {
                        term.writeln("\r\n Session closed");
                        ws.close();
                    }
                } catch {
                    term.writeln("\r\n Failed to decode message");
                }
            } else if (typeof evt.data === "string") {
                term.write(evt.data);
            }
        };
        ws.onclose = (evt) => {
            const msg = formatWebSocketError(`close ${evt.code} ${evt.reason}`);
            term.writeln(`\r\n ${msg}`);
        };
        ws.onerror = (evt: any) => {
            const msg = formatWebSocketError(evt.message || "Connection error");
            term.writeln(`\r\n ${msg}`);
        };

        const inputListener = term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                const msg: Message = {
                    type: MessageTypeStdin,
                    data: new TextEncoder().encode(data),
                    microserviceUuid: "",
                    execId: "",
                    timestamp: Date.now(),
                };
                const encoded = msgpack.serialize(msg);
                ws.send(encoded);
            }
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
