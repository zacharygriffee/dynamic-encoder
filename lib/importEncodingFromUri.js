import cenc from "compact-encoding";
import b4a from "b4a";
// Dynamically load the module and verify data integrity with optional custom hasher
import {defaultHasher, generateHash} from "./hasher.js";

// Dynamically load the module and verify data integrity with optional custom hasher
async function importEncodingFromUri(dataUri, expectedHash, hasherOrDeps = defaultHasher, dependencies = {}) {
    let hasher = defaultHasher;

    // If `hasherOrDeps` is a function, treat it as the hasher, otherwise treat it as dependencies
    if (typeof hasherOrDeps === 'function') {
        hasher = hasherOrDeps;
    } else if (typeof hasherOrDeps === 'object') {
        dependencies = hasherOrDeps;
    }

    // Sort dependencies by their keys to ensure consistent argument order
    const sortedDependencies = Object.keys(dependencies).sort().map(key => dependencies[key]);

    const module = await import(dataUri);
    const loadedEncoder = module.default(cenc, b4a, ...sortedDependencies);

    // Generate the hash using the same logic as during creation
    const computedHash = await generateHash(loadedEncoder, dependencies, hasher);

    // Verify that the computed hash matches the expected hash
    if (computedHash !== expectedHash) {
        throw new Error("Data integrity check failed: hash mismatch.");
    }

    return cenc.from(loadedEncoder);  // Return the verified encoder
}





export {importEncodingFromUri as load};