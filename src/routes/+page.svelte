<script lang="ts">
    import { onMount } from "svelte";
    import { createCredentials, setupMessageHandler } from "$lib";

    const DEFAULT_RELAYS = ["wss://nos.lol", "wss://relay.damus.io"];

    interface Identity {
        nsec: string;
        npub: string;
        allowedOrigins: string[];
        relays: string[];
    }

    let identity = $state<Identity | null>(null);
    let newOrigin = $state("");
    let newRelay = $state("");
    let showSecretKey = $state(false);
    let showPublicKey = $state(false);

    onMount(() => {
        const saved = localStorage.getItem("nostr_identity");
        if (saved) {
            identity = JSON.parse(saved);
            // Add default relays if none exist
            if (!identity!.relays || identity!.relays.length === 0) {
                identity!.relays = [...DEFAULT_RELAYS];
                saveIdentity();
            }
        }
        setupMessageHandler();
    });

    function saveIdentity() {
        if (identity) {
            localStorage.setItem("nostr_identity", JSON.stringify(identity));
        }
    }

    function createIdentity() {
        const creds = createCredentials();
        identity = {
            ...creds,
            allowedOrigins: [],
            relays: [...DEFAULT_RELAYS],
        };
        saveIdentity();
    }

    function addNewOrigin() {
        if (!newOrigin.trim() || !identity) return;

        try {
            const originUrl = new URL(newOrigin);
            const origin = originUrl.origin;

            if (!identity.allowedOrigins.includes(origin)) {
                identity.allowedOrigins = [...identity.allowedOrigins, origin];
                saveIdentity();
            }
            newOrigin = "";
        } catch (e) {
            alert("Please enter a valid URL");
        }
    }

    function addNewRelay() {
        if (!newRelay.trim() || !identity) return;

        try {
            const relayUrl = new URL(newRelay);
            if (!relayUrl.protocol.startsWith("ws")) {
                throw new Error(
                    "Relay URL must use WebSocket protocol (ws:// or wss://)",
                );
            }
            const relay = relayUrl.toString();

            if (!identity.relays.includes(relay)) {
                identity.relays = [...identity.relays, relay];
                saveIdentity();
            }
            newRelay = "";
        } catch (e) {
            alert("Please enter a valid WebSocket URL (ws:// or wss://)");
        }
    }

    function removeOrigin(originToRemove: string) {
        if (!identity) return;
        identity.allowedOrigins = identity.allowedOrigins.filter(
            (o) => o !== originToRemove,
        );
        saveIdentity();
    }

    function removeRelay(relayToRemove: string) {
        if (!identity) return;
        identity.relays = identity.relays.filter((r) => r !== relayToRemove);
        saveIdentity();
    }

    function resetIdentity() {
        if (
            confirm(
                "Are you sure you want to reset your identity? This cannot be undone.",
            )
        ) {
            identity = null;
            localStorage.removeItem("nostr_identity");
        }
    }
</script>

<div class="min-h-screen bg-gray-50 p-4">
    <div class="max-w-lg mx-auto">
        <h1 class="text-3xl font-bold text-center text-gray-800 mb-8">
            Nostr Signer
        </h1>

        {#if !identity}
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold text-gray-700 mb-4">
                    Create Your Nostr Identity
                </h2>
                <p class="text-gray-600 mb-6">
                    Create your Nostr identity to start signing messages.
                </p>
                <button
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                    on:click={createIdentity}
                >
                    Create Identity
                </button>
            </div>
        {:else}
            <div class="bg-white rounded-lg shadow p-6 space-y-6">
                <!-- Identity Keys -->
                <div>
                    <div class="mb-4">
                        <button
                            class="flex items-center justify-between w-full text-left"
                            on:click={() => (showPublicKey = !showPublicKey)}
                        >
                            <span class="font-medium">Public Key</span>
                            <span>{showPublicKey ? "−" : "+"}</span>
                        </button>
                        {#if showPublicKey}
                            <div class="mt-2 bg-gray-50 p-3 rounded">
                                <code class="text-sm break-all"
                                    >{identity.npub}</code
                                >
                            </div>
                        {/if}
                    </div>

                    <div class="mb-4">
                        <button
                            class="flex items-center justify-between w-full text-left"
                            on:click={() => (showSecretKey = !showSecretKey)}
                        >
                            <span class="font-medium">Secret Key</span>
                            <span>{showSecretKey ? "−" : "+"}</span>
                        </button>
                        {#if showSecretKey}
                            <div
                                class="mt-2 bg-yellow-50 p-3 rounded border border-yellow-200"
                            >
                                <code class="text-sm break-all"
                                    >{identity.nsec}</code
                                >
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Origins -->
                <div>
                    <h3 class="font-medium mb-2">Allowed Origins</h3>
                    <div class="flex gap-2 mb-4">
                        <input
                            type="url"
                            bind:value={newOrigin}
                            placeholder="https://example.com"
                            class="flex-1 border rounded px-3 py-1.5"
                        />
                        <button
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded disabled:bg-gray-400"
                            on:click={addNewOrigin}
                            disabled={!newOrigin.trim()}
                        >
                            Add
                        </button>
                    </div>

                    <div class="space-y-2">
                        {#each identity.allowedOrigins as origin}
                            <div
                                class="flex items-center justify-between bg-gray-50 p-2 rounded"
                            >
                                <code class="text-sm">{origin}</code>
                                <button
                                    class="text-red-500 hover:text-red-600"
                                    on:click={() => removeOrigin(origin)}
                                >
                                    ×
                                </button>
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- Relays -->
                <div>
                    <h3 class="font-medium mb-2">Allowed Relays</h3>
                    <div class="flex gap-2 mb-4">
                        <input
                            type="url"
                            bind:value={newRelay}
                            placeholder="wss://example.com"
                            class="flex-1 border rounded px-3 py-1.5"
                        />
                        <button
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded disabled:bg-gray-400"
                            on:click={addNewRelay}
                            disabled={!newRelay.trim()}
                        >
                            Add
                        </button>
                    </div>

                    <div class="space-y-2">
                        {#each identity.relays as relay}
                            <div
                                class="flex items-center justify-between bg-gray-50 p-2 rounded"
                            >
                                <code class="text-sm">{relay}</code>
                                <button
                                    class="text-red-500 hover:text-red-600"
                                    on:click={() => removeRelay(relay)}
                                >
                                    ×
                                </button>
                            </div>
                        {/each}
                    </div>
                </div>

                <button
                    class="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded"
                    on:click={resetIdentity}
                >
                    Reset Identity
                </button>
            </div>
        {/if}
    </div>
</div>
