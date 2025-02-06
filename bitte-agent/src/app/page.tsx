'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { NearContext, Wallet } from '@/wallets/near';
import { NetworkId } from '@/config';

export default function Home() {
  // Track the current signed-in account ID.
  const [signedAccountId, setSignedAccountId] = useState('');
  const [accessKeys, setAccessKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [conversionInfo, setConversionInfo] = useState(null);

  // New state variables to parameterize deposit, swap and withdraw amounts
  const [depositAmount, setDepositAmount] = useState("0.01");
  const [swapAmount, setSwapAmount] = useState("0.01");
  const [withdrawAmount, setWithdrawAmount] = useState("0.01");

  // Create and memoize the wallet instance.
  const wallet = useMemo(() => new Wallet({ networkId: NetworkId }), []);

  // Initialize the wallet on mount.
  useEffect(() => {
    wallet.startUp(setSignedAccountId);
  }, [wallet]);

  useEffect(() => {
    async function fetchAccessKeys() {
      if (signedAccountId) {
        try {
          const keys = await wallet.getAccessKeys(signedAccountId);
          setAccessKeys(keys);
          if (keys.length > 0) {
            setSelectedKey(keys[0].public_key);
          }
        } catch (error) {
          console.error('Failed to fetch access keys:', error);
        }
      }
    }
    fetchAccessKeys();
  }, [signedAccountId, wallet]);

  // Determine the authentication action and label.
  const handleAuthAction = signedAccountId ? wallet.signOut : wallet.signIn;
  const authLabel = signedAccountId ? `Logout ${signedAccountId}` : 'Login';

  // Handlers for test buttons (ensure these functions exist in your Wallet class)
  const handleCreateFunctionKey = async () => {
    if (wallet.createFunctionKey) {
      await wallet.createFunctionKey();
    } else {
      console.log('createFunctionKey not implemented');
    }
  };

  const handleRegister = async () => {
    if (wallet.register) {
      await wallet.register();
    } else {
      console.log('register not implemented');
    }
  };

  const handleDeposit = async () => {
    if (wallet.deposit) {
      await wallet.deposit(depositAmount);
    } else {
      console.log('deposit not implemented');
    }
  };

  const handleSwap = async () => {
    if (wallet.swap) {
      const result = await wallet.swap(swapAmount);
      if (result) {
        setConversionInfo(result);
      }
    } else {
      console.log('swap not implemented');
    }
  };

  const handleWithdraw = async () => {
    if (wallet.withdraw) {
      const result = await wallet.withdraw(withdrawAmount);
      if (result) {
        setConversionInfo(result);
      }
    } else {
      console.log('withdraw not implemented');
    }
  };

  return (
    <NearContext.Provider value={{ wallet, signedAccountId }}>
      <header className="header">
        <div className="brand">
          <Link href="/">Divvy</Link>
        </div>
        <button className="btn" onClick={handleAuthAction}>
          {authLabel}
        </button>
      </header>
      <div className="content">
        <h1>Test Flow</h1>
        {signedAccountId && (
          <>
            <p className="user-info">Logged in as: {signedAccountId}</p>
            {accessKeys.length > 0 && (
              <div className="access-keys">
                <label htmlFor="accessKeySelect">Select Access Key:</label>
                <select
                  id="accessKeySelect"
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                >
                  {accessKeys.map((key, idx) => (
                    <option key={idx} value={key.public_key}>
                      {key.public_key} - {key.access_key.permission?.FunctionCall ? 'FunctionCall' : 'FullAccess'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
        <div className="button-group">
          <button className="test-btn blue" onClick={handleCreateFunctionKey}>
            Create Function Key
          </button>
          <button className="test-btn blue" onClick={handleRegister}>
            Register
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="test-btn green" onClick={handleDeposit}>
              Deposit
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="test-btn purple" onClick={handleSwap}>
              Swap
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="test-btn purple" onClick={handleWithdraw}>
              Withdraw
            </button>
          </div>
          {conversionInfo && (
            <div className="conversion-info">
              <p>Conversion Rate: 1 NEAR = {conversionInfo.conversionRate} USDC</p>
              <p>Swapped Amount: {conversionInfo.usdcAmount} USDC</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* Global Dark Theme */
        * {
          box-sizing: border-box;
        }

        /* Header Styling */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 1.5rem;
          background: #121212;
          color: #bb86fc;
          height: 60px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .brand {
          font-size: 1.5rem;
          font-weight: bold;
          color: #bb86fc;
        }
        .btn {
          background-color: #03dac6;
          color: #121212;
          border: none;
          padding: 0.5rem 1rem;
          cursor: pointer;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.9rem;
          transition: background-color 0.3s;
        }
        .btn:hover {
          background-color: #02c2ad;
        }

        /* Content Styling */
        .content {
          padding: 2rem;
          background-color: #1e1e1e;
          color: #e0e0e0;
          min-height: calc(100vh - 60px); /* Adjust for header height */
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .user-info {
          margin-top: 1rem;
          font-size: 1rem;
          color: #bb86fc;
        }

        /* Test Buttons Styling */
        .button-group {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 2rem;
        }
        .test-btn {
          padding: 0.6rem 1rem;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.3s;
          /* Keep buttons compact and avoid full width stretch */
          flex: 0 1 auto;
        }
        .test-btn.blue {
          background-color: #0d47a1;
          color: #fff;
        }
        .test-btn.blue:hover {
          background-color: #1565c0;
        }
        .test-btn.green {
          background-color: #2e7d32;
          color: #fff;
        }
        .test-btn.green:hover {
          background-color: #388e3c;
        }
        .test-btn.purple {
          background-color: #6a1b9a;
          color: #fff;
        }
        .test-btn.purple:hover {
          background-color: #7b1fa2;
        }
      `}</style>
      <style jsx>{`
        .access-keys {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
        }

        .access-keys label {
          margin-bottom: 0.5rem;
          font-weight: bold;
        }

        .access-keys select {
          padding: 0.5rem;
          border-radius: 4px;
          border: 1px solid #ccc;
          background-color: #1e1e1e;
          color: #e0e0e0;
        }
      `}</style>
      <style jsx>{`
        .conversion-info {
          margin-top: 1rem;
          padding: 1rem;
          background-color: #2e2e2e;
          border-radius: 8px;
        }
      `}</style>
    </NearContext.Provider>
  );
}
