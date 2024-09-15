// Generate module code template with a hash of the encoder, optional encoder name, and custom hasher
import {generateHash} from "./hasher.js";
import {toDataUri} from "./toDataUri.js";
import {generateFunctionsString} from "./generateFunctionsString.js";

// Generate module code template with a hash of the encoder, optional encoder name, and custom hasher
// Generate module code template with a hash of the encoder, optional encoder name, and custom hasher
async function generateEncodingUri(encoderName = "", encoder, dependencies = {}, hasher) {
    // Sort dependency keys alphabetically
    const dependencyKeys = Object.keys(dependencies).sort();
    const dependencyString = dependencyKeys.length ? `,${dependencyKeys.join(",")}` : "";
    const functionsString = generateFunctionsString(encoder, dependencies);

    // Generate the hash using the provided hasher or default
    const hash = await generateHash(encoder, dependencies, hasher);

    // Only add name and hash if there are valid functions or dependencies
    const nameEntry = encoderName || encoder.name ? `name: "${encoderName || encoder.name}"` : '';
    const hashEntry = `hash: "${hash}"`;

    // Build the final list of properties, ensuring no trailing commas
    const properties = [functionsString, nameEntry, hashEntry].filter(Boolean).join(",\n");

    // Generate module code with dependency keys in alphabetical order
    const moduleCode = `
export default function (cenc, b4a${dependencyString}) {
    return {
        ${properties}
    };
}`;

    return {
        uri: toDataUri(moduleCode),
        hash  // Return the generated hash
    };
}





export {generateEncodingUri as create};