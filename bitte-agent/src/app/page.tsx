'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { NearContext, Wallet } from '@/wallets/near';
import { NetworkId } from '@/config';

export default function Home() {
  // Track the current signed-in account ID.
  const [signedAccountId, setSignedAccountId] = useState('');

  // Create and memoize the wallet instance.
  const wallet = useMemo(() => new Wallet({ networkId: NetworkId }), []);

  // Initialize the wallet on mount.
  useEffect(() => {
    wallet.startUp(setSignedAccountId);
  }, [wallet]);

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
      await wallet.deposit();
    } else {
      console.log('deposit not implemented');
    }
  };

  const handleSwapAndWithdraw = async () => {
    if (wallet.swapAndWithdraw) {
      await wallet.swapAndWithdraw();
    } else {
      console.log('swapAndWithdraw not implemented');
    }
  };

  return (
    <NearContext.Provider value={{ wallet, signedAccountId }}>
      <header className="header">
        <div className="brand">
          <Link href="/">DivvyWealth</Link>
        </div>
        <button className="btn" onClick={handleAuthAction}>
          {authLabel}
        </button>
      </header>
      <div className="content">
        <h1>Test Flow</h1>
        {signedAccountId && (
          <p className="user-info">Logged in as: {signedAccountId}</p>
        )}
        <div className="button-group">
          <button
            className="test-btn blue"
            onClick={handleCreateFunctionKey}
          >
            Create Function Key
          </button>
          <button
            className="test-btn blue"
            onClick={handleRegister}
          >
            Register
          </button>
          <button
            className="test-btn green"
            onClick={handleDeposit}
          >
            Deposit
          </button>
          <button
            className="test-btn purple"
            onClick={handleSwapAndWithdraw}
          >
            Swap and Withdraw
          </button>
        </div>
      </div>

      <style jsx>{`
        /* Header Styling */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 1.5rem;
          background: #1b1b1b;
          color: #00d1b2;
          height: 60px;
          box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .brand {
          font-size: 1.4rem;
          font-weight: bold;
          color: #00d1b2;
        }
        .btn {
          background-color: #007f6e;
          color: #fff;
          border: none;
          padding: 0.5rem 1rem;
          cursor: pointer;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.9rem;
          transition: background-color 0.3s;
        }
        .btn:hover {
          background-color: #005f50;
        }
        /* Content Styling */
        .content {
          padding: 2rem;
          background-color: #000;
          color: #e0e0e0;
          min-height: calc(100vh - 60px); /* Adjust for header height */
        }
        .user-info {
          margin-top: 1rem;
          font-size: 1rem;
          color: #00d1b2;
        }
        /* Test Buttons Styling */
        .button-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 2rem;
        }
        .test-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .test-btn.blue {
          background-color: #007bff;
          color: #fff;
        }
        .test-btn.blue:hover {
          background-color: #0056b3;
        }
        .test-btn.green {
          background-color: #28a745;
          color: #fff;
        }
        .test-btn.green:hover {
          background-color: #1e7e34;
        }
        .test-btn.purple {
          background-color: #6f42c1;
          color: #fff;
        }
        .test-btn.purple:hover {
          background-color: #593093;
        }
      `}</style>
    </NearContext.Provider>
  );
}
