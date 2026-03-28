export async function crypt(data, key, iv) {
    const encoder = new TextEncoder();
  
    const keyHash = await crypto.subtle.digest('SHA-256', encoder.encode(key));
  
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyHash,
        { name: 'AES-CTR' },
        false,
        ['encrypt', 'decrypt']
    );

    if (typeof iv == 'undefined') iv = crypto.getRandomValues(new Uint8Array(16));

    const resultBuffer = await crypto.subtle.encrypt(
        { name: 'AES-CTR', counter: iv, length: 64 },
        cryptoKey,
        data
    );

    return {
        res: new Uint8Array(resultBuffer),
        iv
    };
}
