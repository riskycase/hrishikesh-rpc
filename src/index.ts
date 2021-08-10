import { exec } from 'child_process';
import RPC from 'discord-rpc';
import { clientId, defaultState } from './config.json';

let startTimestamp = Date.now();
let details = defaultState.unlocked;

setInterval(
    () =>
        exec(
            'Get-Process LogonUI',
            { shell: 'powershell.exe' },
            (_error, stdout, _stderr) => {
                if (stdout.trim() !== '') {
                    if (details !== defaultState.onLockScreen) startTimestamp = Date.now();
                    details = defaultState.onLockScreen;
                }
            }
        ),
    500
);

function setPresence() {
    client.setActivity({
        details,
        startTimestamp,
        largeImageKey: 'rog-logo',
        largeImageText: 'ROG',
    });
    setTimeout(setPresence, 5e3);
}

const client = new RPC.Client({ transport: 'ipc' });
client.on('ready', setPresence);

client.login({ clientId }).catch(console.error);
