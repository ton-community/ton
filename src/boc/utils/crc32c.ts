const POLY = 0x82f63b78;

export function crc32c(source: Buffer) {
    let crc = 0 ^ 0xffffffff;
    for (let n = 0; n < source.length; n++) {
        crc ^= source[n];
        crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
        crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
        crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
        crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
        crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
        crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
        crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
        crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
    }
    crc = crc ^ 0xffffffff;

    // Convert endianness
    let res = Buffer.alloc(4);
    res.writeInt32LE(crc);
    return res;
}