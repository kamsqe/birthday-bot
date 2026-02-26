// Validate Telegram initData using WebCrypto
// Formula: secret_key = HMAC(token, "WebAppData")
// hash = HMAC(secret_key, data_check_string)
export async function validateInitData(initData: string, botToken: string): Promise<any | null> {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return null;

    urlParams.delete('hash');
    
    // Sort keys alphabetically
    const keys = Array.from(urlParams.keys()).sort();
    const dataCheckString = keys.map(k => `${k}=${urlParams.get(k)}`).join('\n');

    const encoder = new TextEncoder();
    
    // Create secret key
    const secretKeyBase = await crypto.subtle.importKey(
      'raw',
      encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const secretKeyBuf = await crypto.subtle.sign(
      'HMAC',
      secretKeyBase,
      encoder.encode(botToken)
    );
    
    const secretKey = await crypto.subtle.importKey(
      'raw',
      secretKeyBuf,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Hash data check string
    const signatureBuf = await crypto.subtle.sign(
      'HMAC',
      secretKey,
      encoder.encode(dataCheckString)
    );

    // Convert to hex
    const signatureArray = Array.from(new Uint8Array(signatureBuf));
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (signatureHex === hash) {
      // Valid! Parse the user JSON
      const userStr = urlParams.get('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return true;
    }
    
    return null;
  } catch (e) {
    console.error("Auth validation error:", e);
    return null;
  }
}
