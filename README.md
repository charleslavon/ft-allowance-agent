wip fungible token allowance agent for near.ai

### linting
`autopep8 --in-place --aggressive --aggressive *.py`

### run the agent locally
`nearai agent interactive ~/.nearai/registry/charleslavon.near/ft-allowance/0.0.1 --local`

### download a published agent
`nearai registry download zavodil.near/swap-agent/latest`


### Minimal AI Agent Demo
Divvy is a gain-optimizing Defi Agent that capitalizes on market volatility to grow your wealth, by determining which tokens to periodically swap into stablecoins to secure gains without reducing your portfolio below some minimum USD value. Realize these gains for yourself, or setup a conditional recurring allowance for your crypto curious friends & family.

Our submissions aim to be strong candidates for these tracks - Proximity: $25K Prize Pool (via autonomous use of near-intents), Bitte $5K Prize Pool for our use of chain abstraction, and the General Track DeFi Agents ($20,000 for 5 best teams) As described [here](https://docs.google.com/document/d/1vRSABmFAgrpsEquisKOZcF6ZR9ydzdjY03sFbyleu18/edit?tab=t.0),  and (this is post-minuimum demo) their Absurd Category- push the boundries with creative, outlandish AI experiments (e.g. send a fraction of your swap % to a friend via phone number or to a 5013c Experimental Arts Organization for a tax deductable donation for US Citizens)

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
1. **Introduction (1 minute, 15 seconds)**
We need to make it clear that we intend our submission for 4 prize tracks: Defi, Proximity Labs for our use of near-intents and cross-chain trading, Bitte for our use of chain abstraction,  and (this is post-minuimum demo) Absurd - push the boundries with creative, outlandish AI experiments (send a fraction of your swap % to a friend via phone number or to a 5013c Experimental Arts Organization for a tax deductable donation for US Citizens)

  The protagonist:
    An informercial style video opens in black and white with a dishelved person struggling to carry small plush pillows showing Bitcoin, Ethereum, and Near logos, they claim: "I couldn't buy the dip because I had no leverage, everything dipped, my portfolio tanked. How can I help my bags stay pumped??"

  Narrator:
    There's an AI for that - Simply tell Divvy Bot "whenever my portfolio pumps at least 18%, swap 6% into USDT". Divvy Bot will consider the current USD value of all the chain signature support tokens in your wallet as a minimum threshold, and when the market pumps your value to grow by at least 18%, Divvy Bot uses a limited access key to call a contract deployed onto your account that allows it to autonomously and securely act on your behalf to swap a randomized combination of just enough tokens into your preferred stablecoin to realize 6% growth.

  The protagonist:
    Now in a color video, perhaps with a beautiful background, the person confidently hold much larger plush pillows showing Bitcoin, Ethereum, and Near logos as they claim " I'll never be broke again. I'll always be able to buy the dip."

  Narrator:
   Never be this guy again 

https://github.com/user-attachments/assets/ffed4bef-42b2-4b55-a2e1-fe4e529eabd3


Set and forget it with automated growth based stablecoin swaps, and give yourself a regular stablecoinh allowance throughout volatile markets```

2. **Dig into the details of how everything works. (1 min)**
   - From within the Bitte wallet, go to the AI tab
   - Click on Divvy
   - Divvy shows your portfolio of chainsignature supported tokens
   - Divvy prompts for the info needed to setup an allowance goal
   - Set allowance parameters
     * "Secure profits when portfolio grows 20%"
     * AI explains strategy and confirms understanding
   - Demo trade
   - Highlight automated stablecoin conversion
   - Show allowances

3. Sustainability & Future Features (35 seconds)
  - To sustain our committment to open source, the Divvy Bot applies a fee of 1% of the output token per swap.
  - This revenue will fund future enhancements: a standalone Divvy UI to support users with EVM, Coinbase, and Solana wallets, and what we hope will be part of our unique Intellectual Property, our asset optimization algorithm, which currently takes a randomized approach to determine the ideal quantities of tokens to swap into stablecoins while maintaining a specific ratio of holdings across token types. We will also explore extended this logic to consider SOV from a token's crypto twitter community, a user's comfortable risk level, and marco economic factors.

4. **Wrap-up (10s)**
   - Portfolio dashboard view
   - Disclaimer & Call to action on how to start using Divvy

## Technical Implementation

### 1. Frontend/Bitte.ai Interface

### 2. Smart Contract(research required)

### 3. AI Integration

### 4. Backend

## Blockers:
- **Q:** Is this a **bitte AI agent** or a **near AI agent**? Which would give us an advantage?  
  **A:** **Bitte**  
- **Q:** What role does the **LLM** play in the decision-making and allowance setup?  
  **A:** Setup and interface initially  
- **Q:** Full access key to a wallet has race conditions. We need to determine if the smart contract holds funds.  
  **A:** Research spike on solutions  

## Open Questions:
- **Q:** Where do the allowances get stored and accessed? (growth target, allowance amount, payment frequency)  
  **A:** Secure database (not smart contract) to preserve privacy and prevent frontrunning.  
- **Q:** Where do the **working variables** (e.g., last payment date & amount) get stored?  
  **A:** Research **Bitte** options for storage.  
- **Q:** If we are doing smart contract escrow, what's executing the trade?  
  **A:** Research spike
- **Q:** Stretch goal - Staking integration/optimization, potentially with Nuffle Labs?  
  **A:** Not to be prioritized for now.  

## Key Decisions:
- **Q:** Escrow or FAK?  
  **A:** Research spike needed.  
- **Q:** Bitte or NEAR.ai?  
  **A:** **Bitte**.  
- **Q:** Where does the UX live?  
  **A:** Initially on **Bitte**.

## Research Spikes:
### 1. **Escrow/LAK/FAK Options**  
  - What are the tradeoffs here?  

### 2. **Cron Job Feasibility**  
  - Can we execute trades in the background with cron?  
  - What would be executing the trades?  
  - May need results from the Escrow/LAK/FAK spike to proceed.

### 3. **NEAR Intents:**
  - How do we retrieve **user crypto balances**?  
  - How do we fetch **current prices**?  
  - How to execute **swaps**, handling slippage and fees?  
  - Which **assets** can we support?  
  - How to manage the access key with intents?

### 4. **Allowance storage:**
  - How can we store allowance?
      - Does Bitte have storage options?
      - What about Neon?
