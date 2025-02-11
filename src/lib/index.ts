import { finalizeEvent, generateSecretKey, getPublicKey, nip19, nip04, type Event, nip44 } from 'nostr-tools';

export type NostrRequest =
    | {
        id: string;
        type: 'getPublicKey';
    }
    | {
        id: string;
        type: 'signEvent';
        params: {
            created_at: number;
            kind: number;
            tags: string[][];
            content: string;
        };
    }
    | {
        id: string;
        type: 'getRelays';
    }
    | {
        id: string;
        type: 'nip04.encrypt';
        params: {
            pubkey: string;
            plaintext: string;
        };
    }
    | {
        id: string;
        type: 'nip04.decrypt';
        params: {
            pubkey: string;
            ciphertext: string;
        };
    }
    | {
        id: string;
        type: 'nip44.encrypt';
        params: {
            pubkey: string;
            plaintext: string;
        };
    }
    | {
        id: string;
        type: 'nip44.decrypt';
        params: {
            pubkey: string;
            ciphertext: string;
        };
    };

export type NostrResponse =
    | {
        id: string;
        result: string | Event | Record<string, { read: boolean; write: boolean }>;
        error?: never;
    }
    | {
        id: string;
        result?: never;
        error: string;
    };

declare global {
    interface Window {
        nostr: {
            getPublicKey: () => Promise<string>;
            signEvent: (event: { created_at: number; kind: number; tags: string[][]; content: string }) => Promise<Event>;
            getRelays: () => Promise<{ [url: string]: { read: boolean; write: boolean } }>;
            nip04: {
                encrypt: (pubkey: string, plaintext: string) => Promise<string>;
                decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
            };
            nip44: {
                encrypt: (pubkey: string, plaintext: string) => Promise<string>;
                decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
            };
        };
    }
}

const createCredentials = () => {
    if (typeof window === 'undefined') {
        throw new Error('createCredentials is not available in the server');
    }
    const secretKey = generateSecretKey();
    const publicKey = getPublicKey(secretKey);
    const nsec = nip19.nsecEncode(secretKey);
    const npub = nip19.npubEncode(publicKey);
    window.localStorage.setItem('nostr_identity', JSON.stringify({ nsec, npub, allowedOrigins: [] }));
    return { nsec, npub };
};

const handleNostrRequest = async (request: NostrRequest, origin: string): Promise<NostrResponse> => {
    try {
        const identity = JSON.parse(window.localStorage.getItem('nostr_identity') || '{}');
        if (!identity) {
            alert('No identity found');
            throw new Error('No identity found');
        }
        // Validate origin
        if (!identity.allowedOrigins?.includes(origin)) {
            throw new Error('Origin not allowed');
        }

        const { data: secretKey } = nip19.decode(identity.nsec);
        const { data: publicKey } = nip19.decode(identity.npub);

        switch (request.type) {
            case 'getPublicKey':
                return {
                    id: request.id,
                    result: publicKey as string
                };

            case 'signEvent': {
                const signed = finalizeEvent(request.params, secretKey as Uint8Array);
                return {
                    id: request.id,
                    result: signed
                };
            }

            case 'getRelays': {
                const relays = {
                    'wss://relay.damus.io': { read: true, write: true },
                    'wss://relay.nostr.band': { read: true, write: true },
                    'wss://nos.lol': { read: true, write: true }
                };
                return {
                    id: request.id,
                    result: relays
                };
            }

            case 'nip04.encrypt': {
                const { pubkey, plaintext } = request.params;
                const encrypted = await nip04.encrypt(secretKey as Uint8Array, pubkey, plaintext);
                return {
                    id: request.id,
                    result: encrypted
                };
            }

            case 'nip04.decrypt': {
                const { pubkey, ciphertext } = request.params;
                const decrypted = await nip04.decrypt(secretKey as Uint8Array, pubkey, ciphertext);
                return {
                    id: request.id,
                    result: decrypted
                };
            }

            case 'nip44.encrypt': {
                const { pubkey, plaintext } = request.params;
                const encrypted = nip44.encrypt(plaintext, secretKey as Uint8Array);
                return {
                    id: request.id,
                    result: encrypted
                };
            }

            case 'nip44.decrypt': {
                const { ciphertext } = request.params;
                const decrypted = nip44.decrypt(ciphertext, secretKey as Uint8Array);
                return {
                    id: request.id,
                    result: decrypted
                };
            }

            default:
                throw new Error('Unsupported method');
        }
    } catch (error) {
        return {
            id: request.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

const setupMessageHandler = () => {
    if (typeof window === 'undefined') return;

    window.addEventListener('message', async (event) => {
        console.log('message', event);
        // Validate origin here
        const request = event.data as NostrRequest;

        if (!request || !request.id || !request.type) return;

        const response = await handleNostrRequest(request, event.origin);
        console.log('response', response);
        // Send response back to the parent window
        event.source?.postMessage(response, {
            targetOrigin: event.origin
        });
    });
};

export { createCredentials, setupMessageHandler };