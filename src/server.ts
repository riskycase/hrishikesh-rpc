import { Presence } from 'discord-rpc';
import Express from 'express';
import { createServer, IncomingMessage } from 'http';
import WebSocket from 'ws';
import { setPresence } from '.';

interface AppData {
    uniqueId: string;
    startTime: Date;
    presence?: Presence;
}

interface socketStatus {
    uniqueId: string;
    timer: NodeJS.Timeout;
    isAlive: boolean;
}

function cleanPresence(presence: Presence): Presence {
    if (presence.startTimestamp)
        presence.startTimestamp = new Date(presence.startTimestamp);
    return presence;
}

let runningApps: AppData[] = [];
let webSocketStatuses: socketStatus[] = [];

function heartbeat(secretKey: String) {
    webSocketStatuses[socketIndexFromKey(secretKey)].isAlive = true;
}

function socketIndexFromKey(key: String): number {
    return webSocketStatuses.findIndex(
        socketStatus => socketStatus.uniqueId === key
    );
}

const app = Express();
app.use((_request, response, _next) => {
    response.status(426).send('HTTP not supported');
});

const server = createServer(app);

const webSocketServer = new WebSocket.Server({ server });

webSocketServer.on(
    'connection',
    (webSocket: WebSocket, request: IncomingMessage) => {
        webSocketStatuses.push({
            uniqueId: request.headers['sec-websocket-key'],
            isAlive: true,
            timer: setInterval(() => {
                const webSocketStatusIndex = socketIndexFromKey(
                    request.headers['sec-websocket-key']
                );
                if (!webSocketStatuses[webSocketStatusIndex].isAlive)
                    webSocket.terminate();
                else {
                    webSocketStatuses[webSocketStatusIndex].isAlive = false;
                    webSocket.ping();
                }
            }, 30000),
        });
        runningApps.push({
            uniqueId: request.headers['sec-websocket-key'],
            startTime: new Date(),
        });
        webSocket.on('message', (message: string) => {
            runningApps.find(
                runningApp =>
                    runningApp.uniqueId === request.headers['sec-websocket-key']
            ).presence = Object.keys(JSON.parse(message)).length
                ? cleanPresence(JSON.parse(message))
                : undefined;
            setPresence();
        });
        webSocket.on('pong', () =>
            heartbeat(request.headers['sec-websocket-key'])
        );
        webSocket.on('close', (reason: string) => {
            const webSocketStatusIndex = socketIndexFromKey(
                request.headers['sec-websocket-key']
            );
            clearInterval(webSocketStatuses[webSocketStatusIndex].timer);
            webSocketStatuses.splice(webSocketStatusIndex, 1);
            runningApps.splice(
                runningApps.findIndex(
                    runningApp =>
                        runningApp.uniqueId ===
                        request.headers['sec-websocket-key']
                ),
                1
            );
            setPresence();
        });
    }
);

server.listen(6970);

const getRunningApps = () =>
    runningApps.sort(
        (first, second) =>
            first.startTime.valueOf() - second.startTime.valueOf()
    );

export { getRunningApps };
