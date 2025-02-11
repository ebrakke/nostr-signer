# Nostr Browser Signer

A lightweight, server-free solution for cross-origin Nostr event signing in the browser. This provides a simple alternative to NIP-46 that works on both desktop and mobile browsers without requiring always-on relays or complex connection flows.

## Quick Start

```bash
bun install
bun run dev
cd test-app && python3 -m http.server 8000
```

### In Client Sites
```javascript
import { NostrSigner } from 'nostr-browser-signer';

// Initialize with your bunker URL
const signer = new NostrSigner('https://your-bunker-url.com');

// Connect to Bunker (must be triggered by user action)
await signer.connect();

// Request event signing
const signedEvent = await signer.signEvent({
  kind: 1,
  content: 'Hello Nostr',
  created_at: Math.floor(Date.now() / 1000),
  tags: []
});
```

## How it Works

1. The "Bunker" site securely stores private keys in localStorage and manages all signing operations
2. Client sites communicate with the Bunker through secure cross-origin window messaging
3. Users connect to the Bunker once through a popup window
4. The Bunker window can be minimized but remains active for continuous signing capability

## Features

- ✨ Works seamlessly on both desktop and mobile browsers
- 🚫 No relay servers or backend infrastructure required
- 🔒 Secure cross-origin communication between any site and the Bunker
- 🔑 Persistent permissions for trusted sites
- 🛠️ Simple integration for web developers
- 🚀 Minimal UX friction after initial connection
- 🌐 Compatible with all modern browsers

## Security Considerations

- Private keys never leave the Bunker site
- Strict origin validation for all messages
- User approval required for new origins
- Clear permissions management interface
- No automatic window opening (requires explicit user action)
- Sandboxed execution environment

## Technical Details

### Connection Flow

1. Client site initiates connection through `signer.connect()`
2. User approves the popup window
3. Secure message channel established
4. Origin verified and stored if approved

### Event Signing

1. Client requests signing with `signEvent()`
2. Bunker validates origin and event
3. User approves if needed (configurable)
4. Signed event returned through secure channel

## Limitations

- Bunker window must remain open for signing operations
- Initial connection requires user action (browser popup security)
- Connection state resets on page refresh
- Explicit reconnection needed after closing Bunker window

## Comparison to Alternatives

### vs NIP-46
| Feature | Nostr Browser Signer | NIP-46 |
|---------|---------------------|---------|
| Infrastructure | None required | Requires relay servers |
| Latency | Direct communication | Relay-dependent |
| Mobile Support | Full support | Limited |
| Implementation | Simple | Complex |
| Integration | Straightforward | More involved |

### vs Browser Extensions
| Feature | Nostr Browser Signer | Browser Extensions |
|---------|---------------------|-------------------|
| Installation | No installation | Required |
| Mobile Support | Yes | No |
| Updates | Automatic | Manual |
| Cross-platform | Yes | Browser-specific |

## Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📝 [Documentation](https://docs.example.com)
- 🐛 [Issue Tracker](https://github.com/yourusername/nostr-browser-signer/issues)
- 💬 [Discord Community](https://discord.gg/example)