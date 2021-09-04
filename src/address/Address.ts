const bounceable_tag = 0x11;
const non_bounceable_tag = 0x51;
const test_flag = 0x80;

function crc16(data: Buffer) {
    const poly = 0x1021;
    let reg = 0;
    const message = Buffer.alloc(data.length + 2);
    message.set(data);
    for (let byte of message) {
        let mask = 0x80;
        while (mask > 0) {
            reg <<= 1;
            if (byte & mask) {
                reg += 1;
            }
            mask >>= 1
            if (reg > 0xffff) {
                reg &= 0xffff;
                reg ^= poly;
            }
        }
    }
    return Buffer.from([Math.floor(reg / 256), reg % 256]);
}

function parseFriendlyAddress(src: string) {
    const data = Buffer.from(src, 'base64');

    // 1byte tag + 1byte workchain + 32 bytes hash + 2 byte crc
    if (data.length !== 36) {
        throw new Error('Unknown address type: byte length is not equal to 36');
    }

    // Prepare data
    const addr = data.slice(0, 34);
    const crc = data.slice(34, 36);
    const calcedCrc = crc16(addr);
    if (!(calcedCrc[0] === crc[0] && calcedCrc[1] === crc[1])) {
        throw new Error('Invalid checksum: ' + src);
    }

    // Parse tag
    let tag = addr[0];
    let isTestOnly = false;
    let isBounceable = false;
    if (tag & test_flag) {
        isTestOnly = true;
        tag = tag ^ test_flag;
    }
    if ((tag !== bounceable_tag) && (tag !== non_bounceable_tag))
        throw "Unknown address tag";

    isBounceable = tag === bounceable_tag;

    let workchain = null;
    if (addr[1] === 0xff) { // TODO we should read signed integer here
        workchain = -1;
    } else {
        workchain = addr[1];
    }

    const hashPart = addr.slice(2, 34);

    return { isTestOnly, isBounceable, workchain, hashPart };
}


export class Address {

    readonly workChain: number;
    readonly hash: Buffer;
    readonly isTestOnly: boolean | null;
    readonly isBounceable: boolean | null;

    constructor(source: string | Address) {
        if (typeof source === 'string') {

            // Raw Format
            if (source.indexOf(':') >= 0) {
                this.workChain = parseInt(source.split(":")[0]);
                this.hash = Buffer.from(source.split(":")[1], 'hex');
                this.isTestOnly = null;
                this.isBounceable = null;
            } else {
                let addr = source.replace(/\-/g, '+').replace(/_/g, '\/'); // Convert from url-friendly to true base64
                let r = parseFriendlyAddress(addr);
                this.workChain = r.workchain;
                this.isTestOnly = r.isTestOnly;
                this.isBounceable = r.isBounceable;
                this.hash = r.hashPart;
            }
        } else {
            this.workChain = source.workChain;
            this.hash = source.hash;
            this.isBounceable = source.isBounceable;
            this.isTestOnly = source.isTestOnly;
        }
    }

    toString() {
        return this.workChain + ':' + this.hash.toString('hex');
    }

    toFriendlyString(args?: { urlSafe?: boolean, bounceable?: boolean, testOnly?: boolean }) {
        let urlSafe = !!(args && args.urlSafe);
        let testOnly = !!(args && args.testOnly);
        let bounceable = !!(args && args.bounceable);

        let tag = bounceable ? bounceable_tag : non_bounceable_tag;
        if (testOnly) {
            tag |= test_flag;
        }

        const addr = Buffer.alloc(34);
        addr[0] = tag;
        addr[1] = this.workChain;
        addr.set(this.hash, 2);
        const addressWithChecksum = Buffer.alloc(36);
        addressWithChecksum.set(addr);
        addressWithChecksum.set(crc16(addr), 34);
        return addressWithChecksum.toString(urlSafe ? 'base64url' : 'base64');
    }
}