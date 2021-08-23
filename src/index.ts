import { exec } from 'child_process';
import { Client } from 'discord-rpc';
import { clientId, defaultState } from './config.json';
import { runningGames } from './applications';

let startTimestamp = Date.now();
let details = defaultState.unlocked;
let connectTimeout: NodeJS.Timeout;
let client: Client;

setInterval(
    () =>
        exec(
            'Get-Process LogonUI',
            { shell: 'powershell.exe' },
            (_error, stdout, _stderr) => {
                if (stdout.trim() !== '') {
                    if (details !== defaultState.onLockScreen)
                        startTimestamp = Date.now();
                    details = defaultState.onLockScreen;
                } else if (details !== defaultState.unlocked) {
                    client
                        .clearActivity()
                        .then(client.destroy)
                        .then(() => process.exit());
                }
            }
        ),
    500
);

function setPresence() {
    client
        .setActivity(
            runningGames.length
                ? {
                      details: `Gaming`,
                      startTimestamp: runningGames[0].start,
                      smallImageKey: 'rog',
                      smallImageText: 'ROG',
                      largeImageKey: runningGames[0].imageKey,
                      largeImageText: runningGames[0].name,
                  }
                : {
                      details,
                      startTimestamp,
                      largeImageKey: 'rog',
                      largeImageText: 'ROG',
                  }
        )
        .then(() => setTimeout(setPresence, 5e3))
        .catch(error => {
            console.error(error);
        });
}

function connect() {
    clearTimeout(connectTimeout);
    client = new Client({ transport: 'ipc' });
    client.on('ready', setPresence);
    client.login({ clientId }).catch((error: NodeJS.ErrnoException) => {
        console.error(error);
        if (error.message === 'RPC_CONNECTION_TIMEOUT') {
            connectTimeout = setTimeout(connect, 15e3);
        } else connectTimeout = setTimeout(connect, 2500);
    });
}

connect();
