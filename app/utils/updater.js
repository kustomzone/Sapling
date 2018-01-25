const homedir = require('os').homedir();
const fs = require('fs');
const request = require('request-promise-native');

export default class Updater {

    checkWalletVersion() {
        const path = `${homedir}/.eccoin-wallet`;
        fs.access(`${path}/wallet-version.txt`, (err) => {
            if (err) {
                console.log(err);
                return true;
            } 
            else {
                fs.readFile(`${path}/wallet-version.txt`, 'utf8', (err, data) => {
                if (err) { throw err; } 
                else {
                    const version = data.split(' ')[1];
                    const opts = {
                        url: 'https://api.github.com/repos/Greg-Griffith/eccoin/releases/latest',
                        headers: { 'User-Agent': 'request', },
                    };
                    request(opts).then((response) => {
                        const path = `${homedir}/.eccoin-wallet`;
                        const parsed = JSON.parse(response);
                        const githubVersion = parsed.name.split(' ')[1];
                        if (version !== githubVersion) { return true; } 
                    else { return false; }
                    }).catch(error => console.log(error));
                }
                });
            }
        });
    }
}

export let updater = new Updater();
