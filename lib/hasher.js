// Default hasher using crypto.subtle (for environments that support it)
import {generateFunctionsString} from "./generateFunctionsString.js";
import b4a from "b4a";

export async function defaultHasher(data) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a hash from the stringified encoder functions, with optional custom hasher and b4a
export async function generateHash(encoder, dependencies = {}, hasher = defaultHasher) {
    const functionsString = generateFunctionsString(encoder, dependencies);
    // console.log("Hashing the following functions string:", functionsString);
    const encoderBuffer = b4a.from(functionsString);  // Use b4a for string-to-buffer conversion
    return hasher(encoderBuffer);
}