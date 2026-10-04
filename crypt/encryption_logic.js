async function deriveObsidianKey(offering, salt) {
    const mysticWeaver = new TextEncoder();
    const rawEssence = await crypto.subtle.importKey(
        'raw', 
        mysticWeaver.encode(offering), 
        'PBKDF2', 
        false,
        ['deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 600000,
            hash: 'SHA-256'
        },
        rawEssence, 
        {
            name: 'AES-GCM',
            length: 256
        },
        false,
        ['encrypt', 'decrypt']
    );
}

function downloadBlob(blob, filename) {
    const fixedBlob = blob.type === 'application/octet-stream' ?
        blob :
        new Blob([blob], {
            type: 'application/octet-stream'
        });
    
    const url = URL.createObjectURL(fixedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 150);
}

async function processFiles() {
    hideStatus();
    
    const keyInputEl = document.getElementById('keyInput');
    const fileInput = document.getElementById('fileInput');
    
    if (!keyInputEl || !fileInput) {
        showStatus('Required elements missing from the page.', 'error');
        return;
    }
    
    const offering = keyInputEl.value.trim();
    
    if (!offering) {
        showStatus('Obsidian Key is required ^^', 'error');
        return;
    }
    if (fileInput.files.length === 0) {
        showStatus('Please select at least one file.', 'error');
        return;
    }
    
    try {
        let successCount = 0;
        const total = fileInput.files.length;
        
        for (let i = 0; i < total; i++) {
            const file = fileInput.files[i];
            const fileBuffer = await file.arrayBuffer();
            
            if (currentMode === 'encrypt') {
                
                const magicByte = new TextEncoder().encode('Opalstar');
                const versionByte = new Uint8Array([1]); // Version 1
                
                const salt = crypto.getRandomValues(new Uint8Array(16));
                const saltLen = new Uint8Array(1);
                new DataView(saltLen.buffer).setUint8(0, salt.length);
                
                const nameNonce = crypto.getRandomValues(new Uint8Array(12));
                const nameNonceLen = new Uint8Array(2);
                new DataView(nameNonceLen.buffer).setUint16(0, nameNonce.length, false);

                const dataNonce = crypto.getRandomValues(new Uint8Array(12));
                const dataNonceLen = new Uint8Array(2);
                new DataView(dataNonceLen.buffer).setUint16(0, dataNonce.length, false);
                
                const cryptoKey = await deriveObsidianKey(offering, salt);
                
                const nameBytes = new TextEncoder().encode(file.name);
                if (nameBytes.length > 65535) {
                    continue;
                }
                const encryptedName = await crypto.subtle.encrypt(
                    {
                        name: 'AES-GCM',
                        iv: nameNonce
                    },
                    cryptoKey,
                    nameBytes
                );
                const nameLen = new Uint8Array(2);
                new DataView(nameLen.buffer).setUint16(0, encryptedName.byteLength, false);
                
                const cipher = await crypto.subtle.encrypt(
                    {
                        name: 'AES-GCM',
                        iv: dataNonce
                    },
                    cryptoKey,
                    fileBuffer
                );
                
                const totalLen = 
                    magicByte.length + 
                    versionByte.length + 
                    saltLen.length + 
                    salt.length + 
                    nameNonceLen.length + 
                    nameNonce.length + 
                    nameLen.length + 
                    encryptedName.byteLength + 
                    dataNonceLen.length + 
                    dataNonce.length + 
                    cipher.byteLength;
                
                const out = new Uint8Array(totalLen);
                let off = 0;
                
                out.set(magicByte, off);                     off += magicByte.length;
                out.set(versionByte, off);                   off += versionByte.length;
                out.set(saltLen, off);                       off += saltLen.length;
                out.set(salt, off);                          off += salt.length;
                out.set(nameNonceLen, off);                  off += nameNonceLen.length;
                out.set(nameNonce, off);                     off += nameNonce.length;
                out.set(nameLen, off);                       off += nameLen.length;
                out.set(new Uint8Array(encryptedName), off); off += encryptedName.byteLength;
                out.set(dataNonceLen, off);                  off += dataNonceLen.length;
                out.set(dataNonce, off);                     off += dataNonce.length;
                out.set(new Uint8Array(cipher), off);
                
                const hash = window.location.hash;
                const randomHashBytes = new Uint8Array(16);
                crypto.getRandomValues(randomHashBytes);
                let setFilename;
                
                if (hash.includes('hexname')) {
                    setFilename = "0x" + Array.from(nameBytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase() + ".opalstar";
                } else if (hash.includes('keepname')) {
                    setFilename = file.name;
                } else {
                    setFilename = "0x" + Array.from(randomHashBytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase() + ".opalstar";
                }
                
                downloadBlob(new Blob([out]), setFilename);
                successCount++;
                
            } else {
                
                const dv = new DataView(fileBuffer);
                let off = 0;
                
                const magicByte = new TextDecoder().decode(fileBuffer.slice(off, off + 8));
                off += 8;
                if (magicByte !== 'Opalstar') {
                    console.warn('Skipping', file.name, '— invalid format.');
                    continue;
                }
                
                const fileVersion = dv.getUint8(off);
                off += 1;
                
                switch (fileVersion) {
                    case 1: {
                        
                        const saltLen = dv.getUint8(off); 
                        off += 1;
                        const salt = new Uint8Array(fileBuffer.slice(off, off + saltLen));
                        off += saltLen;

                        const cryptoKey = await deriveObsidianKey(offering, salt);
                        
                        const nameNonceLen = dv.getUint16(off, false); 
                        off += 2;
                        const nameNonce = new Uint8Array(fileBuffer.slice(off, off + nameNonceLen));
                        off += nameNonceLen;

                        const nameLen = dv.getUint16(off, false); 
                        off += 2;
                        const encryptedName = fileBuffer.slice(off, off + nameLen);
                        off += nameLen;
                        
                        const dataNonceLen = dv.getUint16(off, false); 
                        off += 2;
                        const dataNonce = new Uint8Array(fileBuffer.slice(off, off + dataNonceLen));
                        off += dataNonceLen;

                        const cipher = fileBuffer.slice(off);
                        
                        const decryptedNameBytes = await crypto.subtle.decrypt(
                            { name: 'AES-GCM', iv: nameNonce },
                            cryptoKey,
                            encryptedName
                        );
                        
                        let originalName = new TextDecoder().decode(decryptedNameBytes);
                        // originalName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'decrypted_file';
                        
                        const plain = await crypto.subtle.decrypt(
                            { name: 'AES-GCM', iv: dataNonce },
                            cryptoKey,
                            cipher
                        );

                        downloadBlob(new Blob([plain]), originalName);
                        successCount++;
                        break;
                    }
                    
                    case 2: {
                        //
                        //
                        break;
                    }
                    
                    default:
                        console.warn('Skipping', file.name, `— unsupported version: ${fileVersion}`);
                        continue;
                }
            }
        }
        
        if (successCount > 0 && currentMode === 'encrypt') {
            showStatus(`${successCount}/${total} Successfully preserved UwU`, 'success');
        } else if (successCount > 0 && currentMode === 'decrypt') {
            showStatus(`${successCount}/${total} dreams successfully recalled ^o^*`, 'success');
        } else {
            showStatus('Summoned souls are corrupted by Abyss OwO', 'error');
        }
    } catch (err) {
        console.error(err);
        showStatus('Operation failed: ' + (err.message || 'Key or file corrupted.'), 'error');
    }
}
