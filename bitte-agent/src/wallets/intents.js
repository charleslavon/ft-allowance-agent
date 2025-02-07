import { utils } from 'near-api-js';
import crypto from 'crypto';
import { getQuotes } from '@/utils/getQuotes';

const THIRTY_TGAS = '30000000000000';

/**
 * Deposit intent: builds and sends transactions to deposit NEAR.
 * @param {string} amount - the amount of NEAR (as a string) to deposit
 * @returns {Promise<any>} - the result of the transaction
 */
export async function depositIntent(amount) {
  try {
    const depositAmount = utils.format.parseNearAmount(amount);
    const nearDepositAction = {
      type: 'FunctionCall',
      params: {
        methodName: 'near_deposit',
        args: {},
        gas: THIRTY_TGAS,
        deposit: depositAmount,
      }
    };
    const ftTransferCallAction = {
      type: 'FunctionCall',
      params: {
        methodName: 'ft_transfer_call',
        args: {
          receiver_id: "intents.near",
          amount: depositAmount,
          msg: ""
        },
        gas: THIRTY_TGAS,
        deposit: "1",
      }
    };
    const transactions = [{
      receiverId: "wrap.near",
      actions: [nearDepositAction, ftTransferCallAction]
    }];
    const result = await this.signAndSendTransactions({ transactions });
    return result;
  } catch (error) {
    console.error("Deposit intent failed:", error);
    return { error: error.toString() };
  }
}

/**
 * Swap intent: constructs and signs a payload to swap NEAR for a token.
 * @param {string} amount - the NEAR amount to swap (as a string)
 * @param {any} quoteData - (unused) placeholder to match the interface
 * @param {number} deadlineDeltaMs - milliseconds to add for deadline (default: 60000)
 * @returns {Promise<any>} - the result from publishing the signed intent
 */
export async function swapIntent(amount, quoteData, deadlineDeltaMs = 60000) {
  try {
    const nearAmountYocto = utils.format.parseNearAmount(amount);
    if (!nearAmountYocto) {
      throw new Error("Invalid NEAR amount provided.");
    }

    // Define token identifiers.
    const tokenInId = "nep141:wrap.near";
    const assetIdentifierOut = "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";

    // Retrieve the best quote.
    const { bestQuote } = await getQuotes(tokenInId, nearAmountYocto, assetIdentifierOut);
    if (!bestQuote) {
      throw new Error("No best quote returned from getQuotes");
    }

    // Calculate referral fee (1% of amount_out) and net output.
    const referralFeeAmount = String(Math.floor(parseInt(bestQuote.amount_out) / 100));
    const amountOutLessFee = String(parseInt(bestQuote.amount_out) - parseInt(referralFeeAmount));
    // Set a deadline.
    const deadline = new Date(Date.now() + deadlineDeltaMs).toISOString();
    // Generate a random nonce (32 bytes).
    const nonce = crypto.randomBytes(32);

    // Construct the payload.
    const payload = {
      signer_id: this.signedAccountId,
      nonce: nonce,
      verifying_contract: "intents.near",
      deadline: deadline,
      intents: [
        {
          intent: "token_diff",
          diff: {
            [bestQuote.token_in]: "-" + bestQuote.amount_in,
            [bestQuote.token_out]: amountOutLessFee,
          },
          referral: "benevio-labs.near"
        },
        {
          intent: "transfer",
          receiver_id: "benevio-labs.near",
          tokens: {
            [bestQuote.token_out]: referralFeeAmount
          },
          memo: "referral_fee"
        }
      ]
    };

    if (!this.signedAccountId) {
      throw new Error("Wallet is not signed in");
    }

    const recipient = "intents.near";
    const msg = {
      message: JSON.stringify(payload),
      nonce: nonce,
      recipient: recipient,
      callbackUrl: undefined
    };

    const walletSelector = await this.selector;
    const selectedWallet = await walletSelector.wallet();
    const signedPayload = await selectedWallet.signMessage(msg);

    // Publish the signed intent via the RPC endpoint.
    const rpcResponse = await fetch("https://solver-relay-v2.chaindefuser.com/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "dontcare",
        jsonrpc: "2.0",
        method: "publish_intent",
        params: signedPayload
      })
    });
    const published = await rpcResponse.json();
    return published;
  } catch (error) {
    console.error("Swap intent failed:", error);
    return { error: error.toString() };
  }
}

/**
 * Withdraw intent: builds and publishes a composite intent for withdrawing tokens.
 * @param {string} amount - the token amount (as a string) to withdraw
 * @param {number} deadlineDeltaMs - milliseconds to add for deadline (default: 60000)
 * @returns {Promise<any>} - the result from publishing the signed intent
 */
export async function withdrawIntent(amount, deadlineDeltaMs = 60000) {
  try {
    const receiver = this.signedAccountId || "unknown";
    // Build the ft_withdraw intent.
    const ftWithdrawIntent = {
      intent: "ft_withdraw",
      token: "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
      receiver_id: receiver,
      amount: amount,
      signer_id: receiver
    };

    // Build the USDC swap intent.
    const deadline = new Date(Date.now() + deadlineDeltaMs).toISOString();
    const usdcSwapIntent = {
      deadline: deadline,
      intents: [
        {
          intent: "token_diff",
          diff: {
            "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near": "-" + amount,
            "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1": amount
          },
          referral: "near-intents.intents-referral.near"
        },
      ]
    };

    // Combine both intents.
    const combinedIntent = [ftWithdrawIntent, usdcSwapIntent];

    const rpcResponse = await fetch("https://solver-relay-v2.chaindefuser.com/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "dontcare",
        jsonrpc: "2.0",
        method: "publish_intent",
        params: combinedIntent
      })
    });
    const published = await rpcResponse.json();
    return published;
  } catch (error) {
    console.error("Withdraw intent failed:", error);
    return { error: error.toString() };
  }
}

/**
 * Checks if the current account's public key is registered on NEAR.
 * @param {string} key - The public key to check.
 * @returns {Promise<boolean>} - True if registered, false otherwise.
 */
export async function hasPublicKey(key) {
  if (!this.signedAccountId) return false;
  try {
    const result = await this.viewMethod({
      contractId: "intents.near",
      method: "has_public_key",
      args: { account_id: this.signedAccountId, public_key: key },
    });
    return result;
  } catch (error) {
    console.error("Error checking public key registration:", error);
    return false;
  }
}

/**
 * Gets the balance of a token for the current account via intents.
 * @param {string} tokenId - The token identifier.
 * @returns {Promise<string|number>} - The token balance (as returned by the contract).
 */
export async function getTokenBalance(tokenId) {
  try {
    const result = await this.viewMethod({
      contractId: "intents.near",
      method: "mt_balance_of",
      args: { account_id: this.signedAccountId, token_id: tokenId },
    });
    return result;
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return "0";
  }
}
