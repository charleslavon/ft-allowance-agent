wip fungible token allowance agent for near.ai

### linting
`autopep8 --in-place --aggressive --aggressive *.py`

### run the agent locally
`nearai agent interactive ~/.nearai/registry/charleslavon.near/ft-allowance/0.0.1 --local`

### download a published agent
`nearai registry download zavodil.near/swap-agent/latest`


### Minimal AI Agent Demo
Divvy is a gain-optimizing Defi Agent that capitalizes on market volatility to grow your wealth, by determining which tokens to periodically swap into stablecoins to secure gains without reducing your portfolio below some minimum USD value. Realize these gains for yourself, or setup a conditional recurring allowance for your crypto curious friends & family.

Our submissions aim to be strong candidates for these tracks - Proximity: $25K Prize Pool (via autonomous use of near-intents), $5K Prize Pool, and the General Track DeFi Agents ($20,000 for 5 best teams) As described [here](https://docs.google.com/document/d/1vRSABmFAgrpsEquisKOZcF6ZR9ydzdjY03sFbyleu18/edit?tab=t.0)

1. The Agent is deployed onto Bitte's Agent protocol, which is beneifical for this minimal scope due to it's heavy use of [nextjs scaffolding](https://www.bitte.ai/registry/agent-starter) and easy integration into Bitte Wallet's Agent UI. This chat based interaction in Bitte's UI can be used all the flows which require user interaction to setup an allowance goal.  Originally I thought that we would only leverage Bitte's Agent UI to setup the allowance goal, and when a goal's growth conditions are satisified, it would then trigger a near.ai agent to act on the user's behalf, but I think that's a dependency that can be removed if we can trigger a Bitte agent to run autonomously, similar to [Delta Trade](https://www.bitte.ai/registry/dcaagent.deltatrade.ai)
1. Hard Requirements for Qualification. A video overview of the agent-building transactions is required. The agent must be hosted to enable testing by the judges. Additionally, the agent must be open source. The Bitte team is available to assist with hosting if needed @ https://t.me/bitteai.
1. Introduction text to describe what the agent can do for its target audience of crypto-native holders of chain-signature supported tokens: "I can help you set a recurring cash-out into stablecoins based off the potential growth in your tokens. Shall we get started?"
1. [AI prompt users for the info needed for whatever auth solution we land on] e.g. Explain that you can grant the agent a Full Access Key such that it can execute deposits and swaps on your behalf, or you can approve transactions to deploy a swaps-functions contract onto your account and grant the Agent Limited Access to only call this contract.
  1. e.g. charles.testnet holds ETH-omni, BTC-omni, Near, a swap-functions contract is deployed onto charles.testnet with guardrail logic and support for initiating some number of a set of transactions if that logic passes: deposit, publish_intent, withdraw on wrap.near and intents.near. The agent gets a limited access key to call this method on charles.testnet with the tokenIds and quantity params of its choosing.
  1. Need to test if this would actually work of whether a LAK's [inability to attach tokens](https://docs.near.org/concepts/protocol/access-keys#function-call-keys) to a function call would be a blocker.
1. The agent fetches and displays a count of the NEAR, and omni-bridge tokens on a user's account, along with each token's current price, and the current combined USD value of all of these tokens (this can be considered the total minimum portfolio value, growth can be calculated as a difference from this amount.)
1. The agent prompts the user to create an allowance goal. "What percentage growth rate are you looking to achieve before diversifying into stablecoins?" "Do you have a preference for USDT or USDC stablecoins?"
1. The agent confirms the input params needed to setup an allowance goal
1. The agent should be able to provide the user with an update on the status of their currently active allowance goals. e.g. a textual representation of the Activity section from the UI design
   <img width="660" alt="Allowance Activity" src="https://github.com/user-attachments/assets/975c0071-7186-4932-8361-81a36dbf31f8" />

1. After showing the above flows and the status of configured allowances, perhaps we cut to showing the nearblocks transctions of when an allowance goal is triggered and executed.  Perhaps it would also be helpful to show any internal logs that we have which show the growth conditional being satisifed and the call to trigger the agent/contract.

## Demo Flow (3 minutes)
1. **Introduction (30s)**
   - Value prop, needs refinement: "Alice wants to easily invest in crypto and gain an income as the prices go up."
   - Problem statement: Manual portfolio management is time-consuming, asocial, and risky

2. **Core Interaction (60s)**
   - Wallet connection demo(bitte?)
   - Set allowance parameters
     * "Secure profits when portfolio grows 20%"
     * AI explains strategy and confirms understanding

3. **Execution Showcase (60s)**
   - Show portfolio
   - Demo trade
   - Highlight automated stablecoin conversion
   - Show allowances

4. **Wrap-up (30s)**
   - Portfolio dashboard view
   - Next steps and future features

## Technical Implementation

### 1. Smart Contract
- Secure escrow functionality
- Permission management system
- Core functions:
  * Deposit/withdraw
  * Allowance creation
  * Allowance removal
  * Allowance expiration

### 2. AI Integration
- Natural language interaction for setup
- Price monitoring and analysis
- NEAR Intents swap

### 3. Frontend/Bitte.ai Interface

## Potential Blockers:
- Is this a **bitte AI agent** or a **near AI agent**? Which would give us an advantage?
- What role does the **LLM** play in the decision making and allowance setup?
- Full access key to a wallet has race conditions. We need to determine if the smart contract holds funds.

## Open Questions:
- Where do the allowances get stored and accessed? (growth target, allowance amount, payment frequency)
- Where do the **working variables** get stored? (last payment date & amount)
- If we are doing smart contract escrow, what's executing the trade?

## Decisions to be made:
* escrow or FAK?
* bitte or NEAR.ai?
* Where does the UX live?

## Spike - Near Intents:
- How do we get **user crypto balances**?
- How do we get **current prices**?
- How to execute **swaps**? slippage and fees?
- What **assets** can we support?
- How to manage access key with intents?
