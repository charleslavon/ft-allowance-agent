import { createContext } from 'react';

// near api js
import { providers, utils } from 'near-api-js';

// wallet selector
import '@near-wallet-selector/modal-ui/styles.css';
import { setupModal } from '@near-wallet-selector/modal-ui';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupHereWallet } from '@near-wallet-selector/here-wallet';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupLedger } from '@near-wallet-selector/ledger';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupSender } from '@near-wallet-selector/sender';
import { setupBitteWallet } from '@near-wallet-selector/bitte-wallet';

// ethereum wallets
import { wagmiConfig, web3Modal } from '@/wallets/web3modal';
import { setupEthereumWallets } from "@near-wallet-selector/ethereum-wallets";

const THIRTY_TGAS = '30000000000000';
const NO_DEPOSIT = '0';

export class Wallet {
  /**
   * @constructor
   * @param {Object} options - the options for the wallet
   * @param {string} options.networkId - the network id to connect to
   * @param {string} options.createAccessKeyFor - the contract to create an access key for
   * @example
   * const wallet = new Wallet({ networkId: 'testnet', createAccessKeyFor: 'contractId' });
   * wallet.startUp((signedAccountId) => console.log(signedAccountId));
   */
  constructor({ networkId = 'testnet', createAccessKeyFor = undefined }) {
    this.createAccessKeyFor = createAccessKeyFor;
    this.networkId = networkId;
  }

  /**
   * To be called when the website loads
   * @param {Function} accountChangeHook - a function that is called when the user signs in or out#
   * @returns {Promise<string>} - the accountId of the signed-in user 
   */
  startUp = async (accountChangeHook) => {
    this.selector = setupWalletSelector({
      network: this.networkId,
      modules: [
        setupMyNearWallet(),
        setupHereWallet(),
        setupLedger(),
        setupMeteorWallet(),
        setupSender(),
        setupBitteWallet(),
        setupEthereumWallets({ wagmiConfig, web3Modal, alwaysOnboardDuringSignIn: true }),
      ],
    });

    const walletSelector = await this.selector;
    const isSignedIn = walletSelector.isSignedIn();
    const accountId = isSignedIn ? walletSelector.store.getState().accounts[0].accountId : '';
    // Store the signed-in account ID for later use in other methods.
    this.signedAccountId = accountId;

    walletSelector.store.observable.subscribe(async (state) => {
      const signedAccount = state?.accounts.find(account => account.active)?.accountId;
      this.signedAccountId = signedAccount || '';
      accountChangeHook(signedAccount || '');
    });

    return accountId;
  };

  /**
   * Displays a modal to login the user
   */
  signIn = async () => {
    const modal = setupModal(await this.selector, { contractId: this.createAccessKeyFor });
    modal.show();
  };

  /**
   * Logout the user
   */
  signOut = async () => {
    const selectedWallet = await (await this.selector).wallet();
    selectedWallet.signOut();
  };

  /**
   * Makes a read-only call to a contract
   * @param {Object} options - the options for the call
   * @param {string} options.contractId - the contract's account id
   * @param {string} options.method - the method to call
   * @param {Object} options.args - the arguments to pass to the method
   * @returns {Promise<JSON.value>} - the result of the method call
   */
  viewMethod = async ({ contractId, method, args = {} }) => {
    const url = `https://rpc.${this.networkId}.near.org`;
    const provider = new providers.JsonRpcProvider({ url });

    const encodedArgs = Buffer.from(JSON.stringify(args)).toString('base64');
    
    try {
      const res = await provider.query({
        request_type: 'call_function',
        account_id: contractId,
        method_name: method,
        args_base64: encodedArgs,
        finality: 'optimistic',
      });
      return JSON.parse(Buffer.from(res.result).toString());
    } catch (error) {
      console.error("Error querying NEAR view method:", error);
      throw error;
    }
  };
  /**
   * Makes a call to a contract
   * @param {Object} options - the options for the call
   * @param {string} options.contractId - the contract's account id
   * @param {string} options.method - the method to call
   * @param {Object} options.args - the arguments to pass to the method
   * @param {string} options.gas - the amount of gas to use
   * @param {string} options.deposit - the amount of yoctoNEAR to deposit
   * @returns {Promise<Transaction>} - the resulting transaction
   */
  callMethod = async ({ contractId, method, args = {}, gas = THIRTY_TGAS, deposit = NO_DEPOSIT }) => {
    // Sign a transaction with the "FunctionCall" action
    const selectedWallet = await (await this.selector).wallet();
    const outcome = await selectedWallet.signAndSendTransaction({
      receiverId: contractId,
      actions: [
        {
          type: 'FunctionCall',
          params: {
            methodName: method,
            args,
            gas,
            deposit,
          },
        },
      ],
    });

    return providers.getTransactionLastResult(outcome);
  };

  /**
   * Makes a call to a contract
   * @param {string} txhash - the transaction hash
   * @returns {Promise<JSON.value>} - the result of the transaction
   */
  getTransactionResult = async (txhash) => {
    const walletSelector = await this.selector;
    const { network } = walletSelector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    // Retrieve transaction result from the network
    const transaction = await provider.txStatus(txhash, 'unnused');
    return providers.getTransactionLastResult(transaction);
  };

  /**
   * Gets the balance of an account
   * @param {string} accountId - the account id to get the balance of
   * @returns {Promise<number>} - the balance of the account
   *  
   */
  getBalance = async (accountId) => {
    const walletSelector = await this.selector;
    const { network } = walletSelector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    // Retrieve account state from the network
    const account = await provider.query({
      request_type: 'view_account',
      account_id: accountId,
      finality: 'final',
    });
    // return amount on NEAR
    return account.amount ? Number(utils.format.formatNearAmount(account.amount)) : 0;
  };

  /**
   * Signs and sends transactions
   * @param {Object[]} transactions - the transactions to sign and send
   * @returns {Promise<Transaction[]>} - the resulting transactions
   * 
   */
  signAndSendTransactions = async ({ transactions }) => {
    const selectedWallet = await (await this.selector).wallet();
    return selectedWallet.signAndSendTransactions({ transactions });
  };

  /**
   * 
   * @param {string} accountId
   * @returns {Promise<Object[]>} - the access keys for the
   */
  getAccessKeys = async (accountId) => {
    const walletSelector = await this.selector;
    const { network } = walletSelector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    // Retrieve account state from the network
    console.log("--", provider)
    const keys = await provider.query({
      request_type: 'view_access_key_list',
      account_id: accountId,
      finality: 'final',
    });
    return keys.keys;
  };

  /**
   * Registers the user's wallet with the contract.
   * NOTE: Adjust the contractId and parameters as required for your application.
   */
  register = async () => {
    try {
      const result = await this.callMethod({
        contractId: "intents.near", // Placeholder contract for registration
        method: "register",
        args: { wallet_address: this.signedAccountId || "unknown" },
        gas: THIRTY_TGAS,
        deposit: "0"
      });
      console.log("Register result:", result);
    } catch (error) {
      console.error("Register failed:", error);
    }
  };

  /**
   * Deposits a specified amount of NEAR.
   * @param {string} amount - The amount of NEAR to deposit.
   */
  deposit = async (amount) => {
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
      console.log("Deposit transaction result:", result);
    } catch (error) {
      console.error("Deposit failed:", error);
    }
  };

  /**
   * Swaps a specified amount of NEAR to USDC.
   * @param {string} amount - Amount in NEAR to swap.
   * @returns {Promise<Object>} - Swap result and published intent info.
   */
  swap = async (amount) => {
    try {
      const yoctoAmount = utils.format.parseNearAmount(amount);
      // Dummy conversion rate: 1 NEAR = 10 USDC (adjust as needed)
      const conversionRate = 10;
      const usdcAmount = (parseFloat(amount) * conversionRate).toFixed(2);
 
      console.log(`Conversion rate: 1 NEAR = ${conversionRate} USDC. Swapping ${amount} NEAR to ${usdcAmount} USDC.`);
 
      const swapResult = await this.callMethod({
        contractId: "swap.near",
        method: "swap",
        args: {
          from_token: "NEAR",
          to_token: "USDC",
          amount: yoctoAmount,
        },
        gas: THIRTY_TGAS,
        deposit: "0"
      });
      console.log("Swap result:", swapResult);
 
      const intent = {
        intent: "swap",
        diff: {
          NEAR: "-" + amount,
          USDC: usdcAmount
        }
      };
 
      const rpcResponse = await fetch("https://solver-relay-v2.chaindefuser.com/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "dontcare",
          jsonrpc: "2.0",
          method: "publish_intent",
          params: [intent]
        })
      });
      const published = await rpcResponse.json();
 
      return { conversionRate, usdcAmount, swapResult, intentPublished: published };
    } catch (error) {
      console.error("Swap failed:", error);
    }
  };

  /**
   * Withdraws a specified amount of USDC to the user's wallet.
   * @param {string} amount - Amount in USDC to withdraw.
   * @returns {Promise<Object>} - Withdraw result and published intent info.
   */
  withdraw = async (amount) => {
    try {
      const receiver = this.signedAccountId || "unknown";

      const withdrawResult = await this.callMethod({
        contractId: "usdc.near",
        method: "withdraw",
        args: {
          receiver_id: receiver,
          amount: amount,
        },
        gas: THIRTY_TGAS,
        deposit: "0"
      });
      console.log("Withdraw result:", withdrawResult);

      const intent = {
        intent: "withdraw",
        diff: {
          USDC: "-" + amount
        }
      };

      const rpcResponse = await fetch("https://solver-relay-v2.chaindefuser.com/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "dontcare",
          jsonrpc: "2.0",
          method: "publish_intent",
          params: [intent]
        })
      });
      const published = await rpcResponse.json();

      return { withdrawResult, intentPublished: published };
    } catch (error) {
      console.error("Withdraw failed:", error);
    }
  };

  /**
   * Checks the status of a swap intent given an intent id.
   * @param {string} intentId - The intent identifier.
   * @returns {Promise<Object>} - The status of the intent.
   */
  checkSwapStatus = async (intentId) => {
    try {
      const response = await fetch("https://solver-relay-v2.chaindefuser.com/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "dontcare",
          jsonrpc: "2.0",
          method: "check_swap_status",
          params: [intentId]
        })
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Check swap status failed:", error);
    }
  };
}

/**
 * @typedef NearContext
 * @property {import('./wallets/near').Wallet} wallet Current wallet
 * @property {string} signedAccountId The AccountId of the signed user
 */

/** @type {import ('react').Context<NearContext>} */
export const NearContext = createContext({
  wallet: undefined,
  signedAccountId: '',
});
