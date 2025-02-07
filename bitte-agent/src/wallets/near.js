import { createContext } from 'react';
import {
  addFunctionCallAccessKey,
  generateRandomKeyPair,
  getSignerFromKeystore,
  getTestnetRpcProvider,
} from '@near-js/client';

import { BrowserLocalStorageKeyStore } from '@near-js/keystores-browser';

// near api js
import { providers, utils } from 'near-api-js';

// wallet selector
import '@near-wallet-selector/modal-ui/styles.css';
import { setupModal } from '@near-wallet-selector/modal-ui';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupBitteWallet } from '@near-wallet-selector/bitte-wallet';

import crypto from 'crypto';

import { getQuotes } from '@/utils/getQuotes';

// Import intent functions from the separate module.
import { depositIntent, swapIntent, withdrawIntent, hasPublicKey } from './intents';

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
    // Bind the intents from the separate module so the interface stays the same.
    this.intents = {
      deposit: depositIntent.bind(this),
      swap: swapIntent.bind(this),
      withdraw: withdrawIntent.bind(this),
      hasPublicKey: hasPublicKey.bind(this),
    };
  }

  /**
   * To be called when the website loads
   * @param {Function} accountChangeHook - a function that is called when the user signs in or out
   * @returns {Promise<string>} - the accountId of the signed-in user 
   */
  startUp = async (accountChangeHook) => {
    this.selector = setupWalletSelector({
      network: this.networkId,
      modules: [
        setupBitteWallet(),
      ],
    });

    const walletSelector = await this.selector;
    const isSignedIn = walletSelector.isSignedIn();
    const accountId = isSignedIn
      ? walletSelector.store.getState().accounts[0].accountId
      : '';
    // Store the signed-in account ID for later use.
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
    // Sign a transaction with the "FunctionCall" action.
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
    // Retrieve transaction result from the network.
    const transaction = await provider.txStatus(txhash, 'unnused');
    return providers.getTransactionLastResult(transaction);
  };

  /**
   * Gets the balance of an account
   * @param {string} accountId - the account id to get the balance of
   * @returns {Promise<number>} - the balance of the account
   */
  getBalance = async (accountId) => {
    const walletSelector = await this.selector;
    const { network } = walletSelector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });
    // Retrieve account state from the network.
    const account = await provider.query({
      request_type: 'view_account',
      account_id: accountId,
      finality: 'final',
    });
    // Return the formatted amount on NEAR.
    return account.amount ? Number(utils.format.formatNearAmount(account.amount)) : 0;
  };

  /**
   * Signs and sends transactions
   * @param {Object[]} transactions - the transactions to sign and send
   * @returns {Promise<Transaction[]>} - the resulting transactions
   */
  signAndSendTransactions = async ({ transactions }) => {
    const selectedWallet = await (await this.selector).wallet();
    return selectedWallet.signAndSendTransactions({ transactions });
  };

  /**
   * Retrieves the access keys for a given account.
   * @param {string} accountId
   * @returns {Promise<Object[]>} - the access keys for the account
   */
  getAccessKeys = async (accountId) => {
    const walletSelector = await this.selector;
    const { network } = walletSelector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });
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
  register = async (key) => {
    try {
      await this.callMethod({
        contractId: "intents.near", // Placeholder contract for registration.
        method: "add_public_key",
        args: { public_key: key },
        gas: THIRTY_TGAS,
        deposit: "1"
      });
    } catch (error) {
      console.error("Register failed:", error);
    }
  };

  /**
   * Creates a new FunctionCall access key for the signed-in user.
   * Outputs the private key to the console for testing.
   * Returns the new key pair.
   */
  createFunctionKey = async () => {
    if (!this.signedAccountId) {
      console.error("User not signed in");
      return;
    }
    const accountId = this.signedAccountId;
    // Initialize RPC provider (assuming testnet; adjust if using another network)
    const rpcProvider = getTestnetRpcProvider();
    // Initialize the signer using credentials stored locally.
    const walletSelector = await this.selector;
    const keystore = new BrowserLocalStorageKeyStore();
    const signer = getSignerFromKeystore(accountId, this.networkId, keystore);
    console.log("await", (await signer).getPublicKey());
    // Generate a new key pair using random data.
    const keyPair = generateRandomKeyPair('ed25519');
    const publicKey = keyPair.getPublicKey().toString();
    const privateKey = keyPair.secretKey;
    // Add the generated key as a FunctionCall access key.
    await addFunctionCallAccessKey({
      account: accountId,
      publicKey,
      contract: this.createAccessKeyFor || accountId,
      methodNames: [],
      allowance: 2500000000000n,
      deps: { rpcProvider, signer },
    });
    console.log("--------------------------------------------------------");
    console.log("RESULTS: Added new function call access key");
    console.log("--------------------------------------------------------");
    console.log(`New Key | ${publicKey} | ${this.createAccessKeyFor || accountId} | []`);
    console.log("--------------------------------------------------------");
    return { publicKey, privateKey };
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
