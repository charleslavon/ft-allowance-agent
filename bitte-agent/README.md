# Divvy Allowance Interface

Setup interface for Divvy - the autonomous profit-taking AI that converts crypto gains into stable income. This interface handles user allowance configuration through Bitte's agent protocol.

## Features
- 🎯 Set profit-taking targets
- 💵 Configure recurring allowance amounts
- ⏱️ Choose payout frequency
- 🔄 Monitor active allowances
- 📊 View portfolio status

## Development Setup

### Environment Configuration
Create a `.env` or `.env.local` file:
```bash
# Get your API key from https://key.bitte.ai
BITTE_API_KEY='your-api-key'
ACCOUNT_ID='your-account.near'
```

### Local Development

#### Chat Interface (localhost:3001)
1. In node_modules/make-agent:
```bash
npx bun run ./src/index.ts dev --port 3000 -t
```

2. In the base directory:
```bash
npx next dev
```

#### Standard Development
1. In node_modules/make-agent:
```bash
npx bun run ./src/index.ts dev-deprecated --port 3000 -t
```

2. In the base directory:
```bash
npx next dev
```

Note: `-t` flag enables testnet

### Building
```bash
pnpm run build  # Local build without deployment
```

### AI Agent Configuration
Customize agent behavior in `/api/ai-plugins/route.ts`. The agent manifest is located at `/.well-known/ai-plugin.json`.

### Deployment
1. Push your code to GitHub
2. Add your `BITTE_API_KEY` to the environment variables
3. The `make-agent deploy` command will automatically run during build
