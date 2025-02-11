import type { Event } from 'nostr-tools';
import type { NostrRequest, NostrResponse } from '../lib';

type RelayPolicy = {
    read: boolean;
    write: boolean;
};

/**
 * Nostr signer class that communicates with a signer iframe
 */
export class Nostr {
    private bunkerWindow: WindowProxy | null = null;
    private pending: Map<string, {
        resolve: (value: any) => void;
        reject: (reason?: any) => void;
    }>;

    constructor(private readonly signerUrl: string) {
        this.pending = new Map();
    }

    public async connect(): Promise<void> {
        if (this.bunkerWindow && !this.bunkerWindow.closed) {
            return;
        }

        this.bunkerWindow = window.open(this.signerUrl, 'NostrSigner', 'width=500,height=500');
        window.addEventListener('message', (event) => {
            const response = event.data as NostrResponse;
            const promise = this.pending.get(response.id);
            if (promise) {
                if (response.error) {
                    promise.reject(new Error(response.error));
                } else {
                    promise.resolve(response.result);
                }
                this.pending.delete(response.id);
            }
        });
    }

    /**
     * Send a request to the signer
     */
    private async sendRequest<T extends Omit<NostrRequest, 'id'>>(request: T): Promise<any> {
        const id = Math.random().toString(36).slice(2);
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.bunkerWindow?.postMessage({
                ...request,
                id
            }, this.signerUrl);
        });
    }

    /**
     * Get the public key from the signer
     */
    async getPublicKey(): Promise<string> {
        return this.sendRequest({ type: 'getPublicKey' });
    }

    /**
     * Sign a Nostr event
     */
    async signEvent(event: {
        created_at: number;
        kind: number;
        tags: string[][];
        content: string;
    }): Promise<Event> {
        return this.sendRequest({
            type: 'signEvent',
            params: event
        });
    }

    /**
     * Get the relay configuration
     */
    async getRelays(): Promise<Record<string, RelayPolicy>> {
        return this.sendRequest({ type: 'getRelays' });
    }

    /**
     * NIP04 encrypt
     */
    async nip04Encrypt(pubkey: string, plaintext: string): Promise<string> {
        return this.sendRequest({
            type: 'nip04.encrypt',
            params: { pubkey, plaintext }
        });
    }

    /**
     * NIP04 decrypt
     */
    async nip04Decrypt(pubkey: string, ciphertext: string): Promise<string> {
        return this.sendRequest({
            type: 'nip04.decrypt',
            params: { pubkey, ciphertext }
        });
    }

    /**
     * NIP44 encrypt
     */
    async nip44Encrypt(pubkey: string, plaintext: string): Promise<string> {
        return this.sendRequest({
            type: 'nip44.encrypt',
            params: { pubkey, plaintext }
        });
    }

    /**
     * NIP44 decrypt
     */
    async nip44Decrypt(pubkey: string, ciphertext: string): Promise<string> {
        return this.sendRequest({
            type: 'nip44.decrypt',
            params: { pubkey, ciphertext }
        });
    }
}