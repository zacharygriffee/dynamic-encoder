export function generateFunctionsString(encoder, dependencies = {}) {
    const { encode, decode, preencode } = encoder;

    // Helper function to handle only function dependencies
    function handleFunction(fnName, fn) {
        const fnString = fn.toString();

        // Detect shorthand methods and convert to full function expression
        if (fnString.startsWith(fnName + '(') || fnString.startsWith(fnName + ' (')) {
            return `${fnName}: function ${fnName}${fnString.slice(fnString.indexOf('('))}`;
        }

        // Otherwise, return function expressions and arrow functions as-is
        return `${fnName}: ${fnString}`;
    }

    // Filter only functions (dependencies that are functions, not objects)
    const depStrings = Object.keys(dependencies)
        .filter(depName => typeof dependencies[depName] === 'function')
        .map(depName => handleFunction(depName, dependencies[depName]));

    // Build the final property list for the encoder, making sure no commas are added unnecessarily
    const properties = [
        encode ? handleFunction('encode', encode) : '',
        decode ? handleFunction('decode', decode) : '',
        preencode ? handleFunction('preencode', preencode) : '',
        ...depStrings
    ].filter(Boolean);  // Remove empty strings

    // If no functions or dependencies exist, return an empty string to avoid commas
    return properties.length > 0 ? properties.join(",\n") : '';
}
