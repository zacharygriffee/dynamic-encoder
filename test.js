import { test, solo } from "brittle";
import cenc from "compact-encoding";
import { create, load } from './index.js'; // Adjust to your actual library path
import codecs from "codecs";
import b4a from "b4a";

const customEncoder1 = {
    encode(state, value) {
        state.buffer = Buffer.from(JSON.stringify(value));  // Encode to JSON
    },
    decode(state) {
        return JSON.parse(state.buffer.toString());  // Decode from JSON
    },
    preencode(state, value) {
        state.length = Buffer.byteLength(JSON.stringify(value));  // Precompute buffer length
    }
};

const customEncoder2 = {
    encode(state, value) {
        state.buffer = Buffer.from(String(value));  // Simple string encoding
    },
    decode(state) {
        return state.buffer.toString();  // Simple string decoding
    },
    preencode(state, value) {
        state.length = Buffer.byteLength(String(value));  // Precompute buffer length
    }
};


test("create and load encoder with custom hasher and dependencies", async t => {
    // Step 2: Custom hasher
    const customHasher = async (data) => {
        // Return a fake hash for testing purposes
        return 'fake-hash';
    };

    // Step 1: Create the encoder with dependencies
    const { uri, hash } = await create('jsonEncoder', cenc.json, {
        hello() {
            return "world";
        }
    }, customHasher);

    // Step 3: Ensure the module URI and hash are generated
    t.ok(uri.length > 0, "Module URI should not be empty");
    t.ok(hash.length > 0, "Hash should be generated");

    // Step 4: Load the encoder module with a custom hasher
    const encoder = await load(uri, hash, customHasher, {
        hello() {
            return "world";
        }
    });

    // Step 5: Ensure the dependencies are injected properly
    t.is(encoder.hello(), "world", "The dependency 'hello' should return 'world'");

    t.pass();
});

test("create and load encoder with default hasher and dependencies", async t => {
    // Step 1: Create the encoder with dependencies
    const { uri, hash } = await create('jsonEncoder', cenc.json, {
        hello() {
            return "world";
        }
    });

    // Step 2: Ensure the module URI and hash are generated
    t.ok(uri.length > 0, "Module URI should not be empty");
    t.ok(hash.length > 0, "Hash should be generated");

    // Step 3: Load the encoder module using default hasher
    const encoder = await load(uri, hash, {
        hello() {
            return "world";
        }
    });

    // Step 4: Ensure the dependencies are injected properly
    t.is(encoder.hello(), "world", "The dependency 'hello' should return 'world'");

    t.pass();
});

test("create and load encoder with no dependencies", async t => {
    // Step 1: Create the encoder without dependencies
    const { uri, hash } = await create('jsonEncoder', cenc.json);

    // Step 2: Ensure the module URI and hash are generated
    t.ok(uri.length > 0, "Module URI should not be empty");
    t.ok(hash.length > 0, "Hash should be generated");

    // Step 3: Load the encoder module without dependencies
    const encoder = await load(uri, hash);

    // Step 4: Ensure the encoder works properly without dependencies
    t.ok(encoder.encode, "Encoder should have an encode function");
    t.ok(encoder.decode, "Encoder should have a decode function");

    t.pass();
});

test("data integrity failure with mismatched hash", async t => {
    // Step 1: Create the encoder with dependencies
    const { uri, hash } = await create('jsonEncoder', cenc.json, {
        hello() {
            return "world";
        }
    });

    // Step 2: Tamper with the hash to simulate a mismatch
    const tamperedHash = 'invalid-hash';

    // Step 3: Try to load the encoder with the tampered hash
    try {
        await load(uri, tamperedHash, {
            hello() {
                return "world";
            }
        });
        t.fail("The integrity check should have failed due to hash mismatch");
    } catch (err) {
        t.ok(err.message.includes("hash mismatch"), "Integrity check should fail with hash mismatch");
    }

    t.pass();
});

test("create and load different encoder types", async t => {
    // Test with int32 encoder
    const { uri: uriInt32, hash: hashInt32 } = await create('int32Encoder', cenc.int32);
    const int32Encoder = await load(uriInt32, hashInt32);
    t.ok(int32Encoder.encode, "int32 encoder should have an encode function");

    // Test with string encoder
    const { uri: uriString, hash: hashString } = await create('stringEncoder', cenc.string);
    const stringEncoder = await load(uriString, hashString);
    t.ok(stringEncoder.encode, "string encoder should have an encode function");

    // Test with raw encoder
    const { uri: uriRaw, hash: hashRaw } = await create('rawEncoder', cenc.raw);
    const rawEncoder = await load(uriRaw, hashRaw);
    t.ok(rawEncoder.encode, "raw encoder should have an encode function");

    t.pass();
});

test("create and load encoder with no functions", async t => {
    const customEncoder = {};  // No functions provided
    const { uri, hash } = await create('emptyEncoder', customEncoder);

    const encoder = await load(uri, hash);

    t.ok(encoder, "Encoder should load successfully even with no functions");

    t.pass();
});

test("pass dependencies without a custom hasher", async t => {
    const { uri, hash } = await create('dependencyTest', cenc.json, {
        dependencyFunc() {
            return "dependency";
        }
    });

    const encoder = await load(uri, hash, {
        dependencyFunc() {
            return "dependency";
        }
    });

    t.is(encoder.dependencyFunc(), "dependency", "Dependency should be injected correctly without a custom hasher");

    t.pass();
});

test("create and load encoder with multiple dependencies", async t => {
    const { uri, hash } = await create('multiDepEncoder', cenc.json, {
        depOne() {
            return "depOne";
        },
        depTwo() {
            return "depTwo";
        }
    });

    const encoder = await load(uri, hash, {
        depOne() {
            return "depOne";
        },
        depTwo() {
            return "depTwo";
        }
    });

    t.is(encoder.depOne(), "depOne", "First dependency should return 'depOne'");
    t.is(encoder.depTwo(), "depTwo", "Second dependency should return 'depTwo'");

    t.pass();
});

test("fail to load invalid data URI", async t => {
    try {
        await load('data:text/javascript;base64,invalidUri', 'invalidHash');
        t.fail("Loading an invalid Data URI should throw an error");
    } catch (err) {
        t.ok(err instanceof SyntaxError, "Error should be a SyntaxError for invalid Data URI");
    }

    t.pass();
});

test("create and load encoder with empty dependencies", async t => {
    const { uri, hash } = await create('emptyDepEncoder', cenc.json, {});

    const encoder = await load(uri, hash, {});

    t.ok(encoder, "Encoder should load successfully with empty dependencies");

    t.pass();
});

test("create and load large encoder module", async t => {
    // Simulate a large encoder by creating a large encode/decode function
    const largeEncoder = {
        encode(state, value) {
            for (let i = 0; i < 10000; i++) {
                cenc.uint64.encode(state, value);
            }
        },
        decode(state) {
            for (let i = 0; i < 10000; i++) {
                return cenc.uint64.decode(state);
            }
        }
    };

    // Step 1: Create the encoder
    const { uri, hash } = await create('largeEncoder', largeEncoder);

    // Step 2: Load the encoder module
    const encoder = await load(uri, hash);

    t.ok(encoder.encode, "Large encoder should load successfully");
    t.pass();
});

test("create and load custom JSON encoder", async t => {
    // Step 1: Create the custom encoder
    const { uri, hash } = await create('jsonEncoder', customEncoder1);

    // Step 2: Load the custom encoder module
    const encoder = await load(uri, hash);

    // Step 3: Encode and decode a value
    const state = { buffer: null };
    encoder.preencode(state, { foo: "bar" });
    state.buffer = Buffer.alloc(state.length);
    encoder.encode(state, { foo: "bar" });

    const decodedValue = encoder.decode(state);
    t.is(decodedValue.foo, "bar", "Custom encoder should correctly encode and decode JSON values");

    t.pass();
});

test("create and load custom string encoder", async t => {
    // Step 1: Create the custom encoder
    const { uri, hash } = await create('stringEncoder', customEncoder2);

    // Step 2: Load the custom encoder module
    const encoder = await load(uri, hash);

    // Step 3: Encode and decode a string value
    const state = { buffer: null };
    encoder.preencode(state, "Hello, World!");
    state.buffer = Buffer.alloc(state.length);
    encoder.encode(state, "Hello, World!");

    const decodedValue = encoder.decode(state);
    t.is(decodedValue, "Hello, World!", "Custom encoder should correctly encode and decode strings");

    t.pass();
});

test("create and load encoder with custom dependencies", async t => {
    const customEncoder = {
        encode(state, value) {
            state.buffer = Buffer.from(String(value));  // Simple string encoding
        },
        decode(state) {
            return state.buffer.toString();
        },
        preencode(state, value) {
            state.length = Buffer.byteLength(String(value));
        }
    };

    // Step 1: Create the encoder with a custom dependency
    const { uri, hash } = await create('customEncoder', customEncoder, {
        customDep() {
            return "dependencyValue";
        }
    });

    // Step 2: Load the encoder module with the custom dependency
    const encoder = await load(uri, hash, {
        customDep() {
            return "dependencyValue";
        }
    });

    // Step 3: Check that the dependency was injected correctly
    t.is(encoder.customDep(), "dependencyValue", "Custom dependency should return 'dependencyValue'");

    t.pass();
});

test("create and load custom JSON encoder", async t => {
    // Define a custom JSON encoder
    const customEncoder = {
        encode(state, value) {
            state.buffer = Buffer.from(JSON.stringify(value));  // Encode as JSON
        },
        decode(state) {
            return JSON.parse(state.buffer.toString());  // Decode from JSON
        },
        preencode(state, value) {
            state.length = Buffer.byteLength(JSON.stringify(value));  // Precompute buffer length
        }
    };

    // Step 1: Create the encoder
    const { uri, hash } = await create('jsonEncoder', customEncoder);

    // Step 2: Load the encoder module
    const encoder = await load(uri, hash);

    // Step 3: Encode and decode a value
    const state = { buffer: null };
    encoder.preencode(state, { foo: "bar" });
    state.buffer = Buffer.alloc(state.length);
    encoder.encode(state, { foo: "bar" });

    const decodedValue = encoder.decode(state);
    t.is(decodedValue.foo, "bar", "The JSON encoder should correctly encode and decode JSON values");

    t.pass();
});

test("create and load custom encoder with dependencies", async t => {
    // Define a custom encoder with dependencies
    const customEncoder = {
        encode(state, value) {
            state.buffer = Buffer.from(value);
        },
        decode(state) {
            return state.buffer.toString();
        },
        preencode(state, value) {
            state.length = Buffer.byteLength(value);
        }
    };

    // Step 1: Create the encoder with a custom dependency
    const { uri, hash } = await create('stringEncoder', customEncoder, {
        customDep() {
            return "injectedValue";
        }
    });

    // Step 2: Load the encoder module and inject the custom dependency
    const encoder = await load(uri, hash, {
        customDep() {
            return "injectedValue";
        }
    });

    // Step 3: Check that the dependency was injected correctly
    t.is(encoder.customDep(), "injectedValue", "The custom dependency should return 'injectedValue'");

    t.pass();
});

test("create and load encoder with alphabetically sorted dependencies", async t => {
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

    // Step 1: Create the encoder with unsorted dependencies
    const { uri, hash } = await create('sortedEncoder', customEncoder, {
        zDep() { return "zDepValue"; },
        aDep() { return "aDepValue"; },
        mDep() { return "mDepValue"; }
    });

    // Step 2: Load the encoder and inject dependencies
    const encoder = await load(uri, hash, {
        zDep() { return "zDepValue"; },
        aDep() { return "aDepValue"; },
        mDep() { return "mDepValue"; }
    });

    // Ensure the dependencies are injected correctly
    t.is(encoder.aDep(), "aDepValue", "aDep should return 'aDepValue'");
    t.is(encoder.mDep(), "mDepValue", "mDep should return 'mDepValue'");
    t.is(encoder.zDep(), "zDepValue", "zDep should return 'zDepValue'");

    t.pass();
});

test("create and load encoder with shorthand methods and arrow functions", async t => {
    // Define an encoder with shorthand methods and arrow functions
    const customEncoder = {
        encode(state, value) {
            state.buffer = Buffer.from(value);  // Shorthand method
        },
        decode: (state) => {
            return state.buffer.toString();  // Arrow function
        }
    };

    // Step 1: Create the encoder with no additional dependencies
    const { uri, hash } = await create('shorthandEncoder', customEncoder);

    // Step 2: Load the encoder module
    const encoder = await load(uri, hash, {});

    // Ensure the encoder loads successfully
    t.ok(encoder.encode, "The encoder should have an encode function");
    t.ok(encoder.decode, "The encoder should have a decode function");

    t.pass();
});

test("replace encoder's dependency with a custom faster version", async t => {
    // Define the encoder with a dependency named `dep`
    const customEncoder = {
        encode(state, value) {
            state.buffer = b4a.from(dep.process(value));  // Apply the dependency during encoding
        },
        decode(state) {
            return state.buffer.toString();  // Directly decode the value without reapplying the dependency
        },
        preencode(state, value) {
            state.length = b4a.byteLength(dep.process(value));  // Precompute the buffer length
        }
    };

    // Step 1: Create the encoder with a slower dependency
    const { uri, hash } = await create('customEncoder', customEncoder, {
        dep: {  // Using `dep` as the key
            process(value) {
                return `slow:${value}`;
            }
        }
    });

    // Step 2: Load the encoder but inject a faster custom dependency
    const encoder = await load(uri, hash, {
        dep: {  // Using the same key `dep` but a faster version
            process(value) {
                return `fast:${value}`;
            }
        }
    });

    // Step 3: Test encoding and decoding with the faster dependency
    const state = { buffer: b4a.alloc(0) };
    encoder.preencode(state, 'Hello, World!');
    encoder.encode(state, 'Hello, World!');
    t.ok(state.buffer.toString(), "Buffer should contain the fast-processed value");

    const decodedValue = encoder.decode(state);  // No need to reapply the dependency in decode
    t.is(decodedValue, 'fast:Hello, World!', "The decoded value should match the fast-processed result");

    t.pass();
});