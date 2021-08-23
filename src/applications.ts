import { exec } from 'child_process';
import path from 'path';

interface GameData {
    name: string;
    start: Date;
    imageKey: string;
}

let runningGames: GameData[];

const execs = [
    {
        displayName: 'American Truck Simulator',
        imageKey: 'ats',
        path: 'D:\\Games\\American Truck Simulator\\bin\\win_x64\\amtrucks.exe',
    },
    {
        displayName: 'Control',
        imageKey: 'control',
        path: 'D:\\Games\\Control\\Control_DX12.exe',
    },
    {
        displayName: 'Control',
        imageKey: 'control',
        path: 'D:\\Games\\Control\\Control_DX11.exe',
    },
    {
        displayName: 'Euro Truck Simulator 2',
        imageKey: 'ets2',
        path: 'D:\\Games\\Euro Truck Simulator 2\\bin\\win_x64\\eurotrucks2.exe',
    },
    {
        displayName: 'Grand Theft Auto IV',
        imageKey: 'gta4',
        path: 'D:\\Games\\Grand Theft Auto IV - The Complete Edition\\GTAIV.exe',
    },
    {
        displayName: 'Halo - The Master Chief Collection',
        imageKey: 'halo_mcc',
        path: 'D:\\Games\\Halo - The Master Chief Collection\\MCC\\Binaries\\Win64\\MCC-Win64-Shipping.exe',
    },
    {
        displayName: 'Minecraft Java',
        imageKey: 'minecraft',
        path: 'C:\\Users\\hrish\\AppData\\Roaming\\.minecraft\\runtime\\java-runtime-alpha\\windows\\java-runtime-alpha\\bin\\javaw.exe',
    },
];

function getRunningApps() {
    const command = `Get-Process ${execs.map(exec =>
        path.basename(exec.path, path.extname(exec.path))
    )} | ForEach-Object {$_ | Add-Member -NotePropertyName UnixTime -NotePropertyValue (Get-Date -Date $_.StartTime  -Format "yyyy-MM-ddTHH:mm:ss"); Write-Output $_} | Select-Object ProcessName,UnixTime | ConvertTo-Json`;
    exec(
        command,
        { shell: 'powershell.exe' },
        (error: Error, stdout: string, stderr: string) => {
            try {
                let stdoutJSON = JSON.parse(stdout);
                runningGames = (
                    Array.isArray(stdoutJSON) ? stdoutJSON : [stdoutJSON]
                )
                    .map(process => ({
                        name: execs.find(
                            exec =>
                                process.ProcessName ===
                                path.basename(
                                    exec.path,
                                    path.extname(exec.path)
                                )
                        ).displayName,
                        start: new Date(process.UnixTime),
                        imageKey: execs.find(
                            exec =>
                                process.ProcessName ===
                                path.basename(
                                    exec.path,
                                    path.extname(exec.path)
                                )
                        ).imageKey,
                    }))
                    .sort(
                        (first, second) =>
                            first.start.valueOf() - second.start.valueOf()
                    );
            } catch {
                runningGames = [];
            }
        }
    );
}
setInterval(getRunningApps, 500);
getRunningApps();

export { runningGames };
