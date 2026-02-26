// test-zws.ts
const ZW0 = '\u200B';
const ZW1 = '\u200C';
const ZWT = '\u200D';

function encodeId(id: number): string {
    const binary = id.toString(2);
    return binary.split('').map(b => b === '0' ? ZW0 : ZW1).join('') + ZWT;
}

function decodeId(text: string): number | null {
    const regex = new RegExp(`([${ZW0}${ZW1}]+)${ZWT}$`);
    const res = text.match(regex);
    if (!res) return null;
    const binary = res[1].split('').map(c => c === ZW0 ? '0' : '1').join('');
    return parseInt(binary, 2);
}

const id = 123;
const encoded = encodeId(id);
console.log("Encoded length:", encoded.length);

const msg = `Reply to this message with a gift idea for Kambar:${encoded}`;
console.log("Msg:", msg);

const decoded = decodeId(msg);
console.log("Decoded ID:", decoded);
