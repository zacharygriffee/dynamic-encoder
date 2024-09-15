# Dynamic Encoder

**Dynamic Encoder** is a powerful JavaScript library designed to create, import, and execute **custom encoders** dynamically using **Data URIs**. It is built specifically to work with the **[`compact-encoding`](https://www.npmjs.com/package/compact-encoding)** library, allowing you to dynamically generate encoders that comply with compact-encoding standards. The library provides a flexible solution for encoding and decoding data with a focus on modularity, security, and runtime dependency injection.

## Key Features

- **Dynamic Module Creation**: Dynamically generates JavaScript encoder modules, converting them into Data URIs.
- **Focus on Compact-Encoding**: Encoders created with the library follow the compact-encoding standard, ensuring efficient and compact data handling.
- **Integrity Verification**: Built-in hash-based integrity checks ensure that dynamically loaded encoders haven’t been tampered with.
- **Dependency Injection**: Automatically injects `cenc`, `b4a`, and custom dependencies into the dynamically created encoder modules.

## Installation

```bash
npm install dynamic-encoder
```

## Usage with Custom Encoders

**Dynamic Encoder** is built for **custom encoders** that comply with the **compact-encoding standard**. The library allows you to dynamically generate, load, and execute encoders while securely handling dependencies and ensuring data integrity.

### Example 1: Creating and Loading a Custom Encoder

This example demonstrates how to create and load a **custom JSON encoder** that follows the **compact-encoding** interface. The encoder has access to `cenc` (from `compact-encoding`) and `b4a` (buffer-to-array).

```js
import { create, load } from 'dynamic-encoder';

// Define a custom encoder
const customEncoder = {
    encode(state, value) {
        state.buffer = b4a.from(JSON.stringify(value));  // Encode as JSON
    },
    decode(state) {
        return JSON.parse(state.buffer.toString());  // Decode from JSON
    },
    preencode(state, value) {
        state.length = b4a.byteLength(JSON.stringify(value));  // Precompute buffer length
    }
};

// Create the encoder
const { uri, hash } = await create('jsonEncoder', customEncoder);

// Load the encoder module and ensure integrity
const encoder = await load(uri, hash);

// Now you can use the encoder to encode/decode data
const state = { buffer: null };
encoder.preencode(state, { foo: "bar" });
state.buffer = b4a.alloc(state.length);
encoder.encode(state, { foo: "bar" });

const decodedValue = encoder.decode(state);
console.log(decodedValue);  // Output: { foo: "bar" }
```

### Example 2: Handling Dependencies in Custom Encoders

In this example, we create an encoder that relies on **custom dependencies**. The **`create`** function automatically injects `cenc`, `b4a`, and any additional dependencies that the encoder requires.

```js
import { create, load } from 'dynamic-encoder';

// Define a custom encoder with dependencies
const customEncoder = {
    encode(state, value) {
        state.buffer = b4a.from(value);
    },
    decode(state) {
        return state.buffer.toString();
    },
    preencode(state, value) {
        state.length = b4a.byteLength(value);
    }
};

// Create the encoder with a dependency
const { uri, hash } = await create('stringEncoder', customEncoder, {
    customDep() {
        return "injectedValue";
    }
});

// Load the encoder and inject the dependency
const encoder = await load(uri, hash, {
    customDep() {
        return "injectedValue";
    }
});

console.log(encoder.customDep());  // Output: "injectedValue"
```

### Compact-Encoder Support

All encoders created and loaded through **Dynamic Encoder** follow the **compact-encoding** standard. Encoders must provide the following methods:
- **`encode`**: Responsible for encoding the value into the state buffer.
- **`decode`**: Responsible for decoding the value from the state buffer.
- **`preencode`**: Responsible for precomputing the buffer size needed for encoding.

---

## API

### `create(encoderName, encoder, dependencies, hasher)`

Generates a Data URI and a hash for the given encoder. It automatically injects `cenc`, `b4a`, and any custom dependencies passed.

- **`encoderName`** (optional): The name of the encoder.
- **`encoder`**: The encoder object with `encode`, `decode`, and optionally `preencode` methods.
- **`dependencies`** (optional): An object of dependency functions to be injected into the encoder.
- **`hasher`** (optional): A custom hash function for integrity verification.

### `load(dataUri, expectedHash, hasherOrDeps, dependencies)`

Dynamically imports the encoder module and verifies its integrity based on the provided hash. It automatically injects `cenc`, `b4a`, and any custom dependencies passed.

- **`dataUri`**: The Data URI of the dynamically created encoder module.
- **`expectedHash`**: The hash of the encoder, used for integrity verification.
- **`hasherOrDeps`**: Either a custom hash function or an object of dependencies.
- **`dependencies`**: If `hasherOrDeps` is a custom hasher, this can be an object of dependencies to inject into the encoder.

---

## Security

- **Hash-Based Integrity**: All dynamically loaded modules are verified using a hash to ensure they haven’t been tampered with. This prevents unauthorized modifications.
- **Dependency Control**: `cenc` and `b4a` are exposed automatically in the module, and only the additional dependencies you specify are injected into the encoder module, ensuring that no unwanted side effects or access to sensitive APIs occur.

## License

MIT License
