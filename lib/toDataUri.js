// Helper to create a Data URI from the module code string
export function toDataUri(code) {
    const base64 = btoa(code);
    return `data:text/javascript;base64,${base64}`;
}