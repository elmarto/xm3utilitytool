"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const zlib_1 = __importDefault(require("zlib"));
const http_1 = __importDefault(require("http"));
const crypto_1 = __importDefault(require("crypto"));
const categoryID = process.argv[2] || 'HP001';
const serviceID = process.argv[3] || 'MDRID285300';
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
        if (res.statusCode !== 200)
            return console.error('服务器错误', res.statusCode, data.toString());
        const headerLength = data.indexOf('\n\n');
        const header = data.slice(0, headerLength).toString();
        const headerSplit = header.match(/eaid:(?<eaid>.*)\ndaid:(?<daid>.*)\ndigest:(?<digest>.*)/);
        if (headerSplit === null)
            return console.error('数据头错误', header);
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
        if (enc === '' || has === '')
            return console.error('加密信息错误', header);
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
            const decipher = crypto_1.default.createDecipheriv(enc, keyBuffer, '');
            decipher.setAutoPadding(false);
            decryptedData = Buffer.concat([decipher.update(cryptedData), decipher.final()]).toString();
        }
        if (has !== 'none') {
            const dataHash = crypto_1.default.createHash(has).update(decryptedData).digest('hex');
            const hash = crypto_1.default.createHash(has).update(dataHash + serviceID + categoryID).digest('hex');
            if (hash !== digest)
                return console.error('数据校验错误', header);
        }
        fs_1.default.writeFile(`./${categoryID}_${serviceID}.xml`, decryptedData, error => {
            if (error !== null)
                console.error('数据写入错误', error);
        });
    })
        .on('error', e => {
        console.error('数据接收错误', e);
    });
})
    .on('error', e => {
    console.error('请求错误', e);
});
