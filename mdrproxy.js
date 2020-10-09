"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const zlib_1 = __importDefault(require("zlib"));
const http_1 = __importDefault(require("http"));
const url_1 = require("url");
const util_1 = require("util");
const fs_1 = require("fs");
const readline_1 = require("readline");
const crypto_1 = require("crypto");
const FSreadFile = util_1.promisify(fs_1.readFile);
const FSreaddir = util_1.promisify(fs_1.readdir);
const infoXML = `<?xml version="1.0" encoding="UTF-8"?><InformationFile LastUpdate="2019-05-01T00:00:00Z" Noop="false" Version="1.0">
<ControlConditions DefaultServiceStatus="open" DefaultVariance="0"/>
<ApplyConditions>
    <ApplyCondition ApplyOrder="1" Force="false">
        <Rules>
            <Rule Type="System" Key="Model" Value="CUSTOM" Operator="NotEqual"/>
            <Rule Type="System" Key="SerialNo" Value="0" Operator="GreaterThanEqual"/>
            <Rule Type="System" Key="FirmwareVersion" Value="0" Operator="NotEqual"/>
        </Rules>
        <Distributions>
            <Distribution ID="FW" InstallParams="" InstallType="binary" MAC="{FWsha1}" Size="{FWlength}" Type="" URI="http://info.update.sony.net/custom_fw.bin" Version="1"/>
            <Distribution ID="Disclaimer" InstallParams="" InstallType="notice" MAC="{Disclaimersha1}" Size="{Disclaimerlength}" Type="" URI="http://info.update.sony.net/custom_disclaimer.xml" Version="1"/>
        </Distributions>
        <Descriptions DefaultLang="English">
            <Description Lang="English" Title="CS"><![CDATA[Do not plug in audio cables or USB cables.
              Otherwise, this device may malfunction.]]></Description>
        </Descriptions>
    </ApplyCondition>
</ApplyConditions>
</InformationFile>`;
const disclaimerXML = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?> 

<NoticeFile Version="1.0" DefaultLocale="en-US">
    <Notice Locale="en">
        <Text><![CDATA[
            ※ Please update under the most stable Bluetooth connection environment.
            * Please note that you should not update when riding in trains or other vehicles, or in environments where Wi-Fi, microwave ovens, cordless phones, and many other radio waves are mixed with 2.4GHz band radio waves.

            ※ Sony | Headphones Connect ※
            Before updating the host, please update to the latest version

            [disclaimer]
            0) I am not responsible for any loss caused by using this software, please make sure that it is genuine and licensed before using it, and be prepared for the warranty
            1) The software update takes about 34 minutes (Android) and 44 minutes (iOS)
            Do not "turn off the power" during update download, data transfer and update.
            Otherwise, the device may become unusable.
            2) Please update after confirming that these headphones and Android devices (or iOS devices) have sufficient battery life.
            3) If a Bluetooth Low Energy device (wearable terminal, smart watch, etc.) is connected to an Android device (or iOS device), it may not be able to update.
            Before updating, please disconnect all Bluetooth devices and Android devices (or iOS devices).
        ]]></Text>
    </Notice>
</NoticeFile>`);
start();
async function start() {
    const select0 = await choose0();
    switch (select0) {
        case '1':
            startProxy('1');
            break;
        case '2':
            const select02 = await choose02();
            switch (select02) {
                case '1':
                    startProxy('21');
                    break;
                case '2':
                    startProxy('22');
                    break;
                case '3':
                    startProxy('23');
                    break;
            }
            break;
        case '3':
            const select03 = await choose03();
            startProxy('3', select03);
            break;
    }
}
function choose() {
    return new Promise(resolve => {
        const rl = readline_1.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.prompt();
        rl.once('line', line => {
            rl.close();
            resolve(line);
        });
    });
}
async function choose0() {
    console.log(`SONY XM3 UTILITY TOOL`);
    console.log(`Use with Sony Headphones Connect 4.1`);
    console.log(`Choose an Option:
1. Force firmware update
2. Force region change
3. Force flash custom firmware (DANGER! DANGER!!)`);
    const select = await choose();
    if (['1', '2', '3'].includes(select))
        return select;
    else
        return choose0();
}
async function choose02() {
    console.log(`Select a region:
1. 00(International)
2. 01(Japanese?)
3. 02(Chinese)`);
    const select = await choose();
    if (['1', '2', '3'].includes(select))
        return select;
    else
        return choose02();
}
async function choose03() {
    const files = await FSreaddir(`${__dirname}/custom/`);
    console.log('Select firmware:');
    files.forEach((name, id) => console.log(`${id + 1}. ${name}`));
    const select = await choose();
    const file = files[+select - 1];
    if (file !== undefined)
        return await FSreadFile(`${__dirname}/custom/${file}`);
    else
        return choose03();
}
function startProxy(mode, fw) {
    http_1.default.createServer()
        .on('request', async (cReq, cRes) => {
        const u = url_1.parse(cReq.url);
        console.log('REQUEST', cReq.url);
        if (u.hostname === 'info.update.sony.net') {
            console.log('----SONY REQUEST', cReq.url);
            if (u.pathname.endsWith('info.xml')) {
                const pathSplit = u.pathname.match(/\/(?<categoryID>\w{5})\/(?<serviceID>\w{11})\//);
                if (pathSplit === null)
                    nothing();
                else {
                    const { categoryID, serviceID } = pathSplit.groups;
                    if (mode === '1' || mode[0] === '2') {
                        const newServiceID = mode === '1' ? serviceID : `${serviceID.slice(0, -1)}${Number.parseInt(mode[1]) - 1}`;
                        const XML = await decryptedXML(categoryID, newServiceID);
                        if (XML === undefined)
                            nothing();
                        else {
                            const editedXML = XML.replace(/<Rule Type="System" Key="FirmwareVersion" Value="[\d\.]+" Operator="Equal"\/>/g, '<Rule Type="System" Key="FirmwareVersion" Value="0" Operator="NotEqual"/>');
                            const myXML = await encryptedXML(categoryID, serviceID, editedXML);
                            end(zlib_1.default.gzipSync(myXML), { 'Content-Type': 'application/xml' });
                        }
                    }
                    else if (mode === '3') {
                        const editedXML = infoXML
                            .replace('{FWsha1}', getHash('sha1', fw))
                            .replace('{FWlength}', fw.length.toString())
                            .replace('{Disclaimersha1}', getHash('sha1', disclaimerXML))
                            .replace('{Disclaimerlength}', disclaimerXML.length.toString());
                        const myXML = await encryptedXML(categoryID, serviceID, editedXML);
                        end(zlib_1.default.gzipSync(myXML), { 'Content-Type': 'application/xml' });
                    }
                    else
                        nothing();
                }
            }
            else if (u.pathname === '/custom_fw.bin') {
                end(zlib_1.default.gzipSync(fw), { 'Content-Type': 'application/octet-stream' });
            }
            else if (u.pathname === '/custom_disclaimer.xml') {
                end(zlib_1.default.gzipSync(disclaimerXML), { 'Content-Type': 'application/xml' });
            }
            else
                nothing();
        }
        else
            nothing();
        function end(data, headers) {
            cRes.writeHead(200, Object.assign({
                'Accept-Ranges': 'bytes',
                'Content-Encoding': 'gzip',
                'Content-Length': data.length,
            }, headers));
            cRes.write(data, 'binary');
            cRes.end();
        }
        function nothing() {
            const options = {
                hostname: u.hostname,
                port: u.port || 80,
                path: u.path,
                method: cReq.method,
                headers: cReq.headers
            };
            const pReq = http_1.default.request(options, pRes => {
                cRes.writeHead(pRes.statusCode, pRes.headers);
                pRes.pipe(cRes);
            }).on('error', () => cRes.end());
            cRes.on('error', () => cReq.destroy());
            cReq.pipe(pReq);
        }
    })
        .on('connect', (cReq, cSock) => {
        console.log('CONNECT:', cReq.url);
        const u = url_1.parse('http://' + cReq.url);
        const hostname = u.hostname;
        const pSock = net_1.default.connect(Number.parseInt(u.port), hostname, () => {
            cSock.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            pSock.pipe(cSock);
        }).on('error', () => cSock.end());
        cSock.on('error', () => pSock.end());
        cSock.pipe(pSock);
    })
        .listen(8848, '0.0.0.0', () => { console.log('Listening: 8848'); });
}
function decryptedXML(categoryID, serviceID) {
    return new Promise(resolve => {
        http_1.default.get(`http://info.update.sony.net/${categoryID}/${serviceID}/info/info.xml`, {
            headers: {
                'User-Agent': 'Dalvik/2.1.0',
                'Accept-Encoding': 'gzip, deflate'
            }
        }, res => {
            let cRes;
            let rawData = [];
            switch (res.headers['content-encoding']) {
                case 'gzip':
                    cRes = res.pipe(zlib_1.default.createGunzip());
                    break;
                case 'deflate':
                    cRes = res.pipe(zlib_1.default.createInflate());
                    break;
                default:
                    cRes = res;
                    break;
            }
            cRes
                .on('data', (chunk) => rawData.push(chunk))
                .on('end', () => {
                const data = Buffer.concat(rawData);
                if (res.statusCode !== 200) {
                    console.error(res.statusCode, data.toString());
                    resolve(undefined);
                }
                else {
                    const headerLength = data.indexOf('\n\n');
                    const header = data.slice(0, headerLength).toString();
                    const headerSplit = header.match(/eaid:(?<eaid>.*)\ndaid:(?<daid>.*)\ndigest:(?<digest>.*)/);
                    if (headerSplit === null) {
                        console.log(header);
                        return resolve(undefined);
                    }
                    const { eaid, daid, digest } = headerSplit.groups;
                    let enc = '';
                    switch (eaid) {
                        case 'ENC0001':
                            enc = 'none';
                            break;
                        case 'ENC0002':
                            enc = 'des-ede3';
                            break;
                        case 'ENC0003':
                            enc = 'aes-128-ecb';
                            break;
                        default:
                            break;
                    }
                    let has = '';
                    switch (daid) {
                        case 'HAS0001':
                            has = 'none';
                            break;
                        case 'HAS0002':
                            has = 'md5';
                            break;
                        case 'HAS0003':
                            has = 'sha1';
                            break;
                        default:
                            break;
                    }
                    if (enc === '' || has === '') {
                        console.log(header);
                        return resolve(undefined);
                    }
                    const cryptedData = data.slice(headerLength + 2);
                    let keyBuffer;
                    let decryptedData = '';
                    if (enc === 'none')
                        decryptedData = cryptedData.toString();
                    else {
                        if (enc === 'des-ede3')
                            keyBuffer = Buffer.alloc(24);
                        else
                            keyBuffer = Buffer.from([79, -94, 121, -103, -1, -48, -117, 31, -28, -46, 96, -43, 123, 109, 60, 23]);
                        const decipher = crypto_1.createDecipheriv(enc, keyBuffer, '');
                        decipher.setAutoPadding(false);
                        decryptedData = Buffer.concat([decipher.update(cryptedData), decipher.final()]).toString();
                    }
                    if (has !== 'none') {
                        const dataHash = getHash(has, decryptedData);
                        const hash = getHash(has, dataHash + serviceID + categoryID);
                        if (hash !== digest) {
                            console.log(header);
                            return resolve(undefined);
                        }
                    }
                    resolve(decryptedData);
                }
            })
                .on('error', e => {
                console.error('Data fetching error', e);
                resolve(undefined);
            });
        }).on('error', e => {
            console.error('Request error', e);
            resolve(undefined);
        });
    });
}
function encryptedXML(categoryID, serviceID, decryptedData) {
    return new Promise(resolve => {
        const decryptedDataBuffer = Buffer.from(decryptedData.trimEnd());
        const padBuffer = Buffer.alloc(32 - decryptedDataBuffer.length % 32, ' ');
        const WTFXMLBuffer = padBuffer.length === 32 ? decryptedDataBuffer : Buffer.concat([decryptedDataBuffer, padBuffer]);
        const dataHash = getHash('sha1', WTFXMLBuffer);
        const hash = getHash('sha1', dataHash + serviceID + categoryID);
        const headerBuffer = Buffer.from(`eaid:ENC0003
daid:HAS0003
digest:${hash}

`);
        const keyBuffer = Buffer.from([79, -94, 121, -103, -1, -48, -117, 31, -28, -46, 96, -43, 123, 109, 60, 23]);
        const encipher = crypto_1.createCipheriv('aes-128-ecb', keyBuffer, '');
        encipher.setAutoPadding(false);
        const bodyBuffer = Buffer.concat([encipher.update(WTFXMLBuffer), encipher.final()]);
        const encryptedData = Buffer.concat([headerBuffer, bodyBuffer]);
        resolve(encryptedData);
    });
}
function getHash(algorithm, data) {
    return crypto_1.createHash(algorithm).update(data).digest('hex');
}
