const axios = require('axios');
const config = require('../config');

/**
 * INJI Wallet Service - Handles credential sharing to Inji Wallet
 * 
 * This service interacts with INJI Wallet APIs to:
 * - Share Verifiable Credentials to user wallets
 * - Send notifications to recipients
 * - Track wallet sharing status
 */

/**
 * Share a Verifiable Credential to Inji Wallet
 * 
 * @param {Object} credentialJson - The issued Verifiable Credential JSON
 * @param {string} recipientEmail - Recipient's email (wallet identifier)
 * @param {string} accessToken - OAuth2 access token for authentication
 * @returns {Object} The sharing result
 */
async function shareCredentialToWallet(credentialJson, recipientEmail, accessToken) {
  if (!config.injiWallet.baseUrl || !config.injiWallet.apiKey) {
    console.warn('INJI Wallet not configured, skipping wallet sharing');
    return { shared: false, reason: 'not_configured' };
  }

  try {
    const response = await axios.post(
      `${config.injiWallet.baseUrl}/api/v1/credentials/share`,
      {
        credential: credentialJson,
        recipient: {
          type: 'email',
          value: recipientEmail,
        },
        notification: {
          method: 'email',
          message: 'Your Digital Product Passport has been issued',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-API-Key': config.injiWallet.apiKey,
        },
      }
    );
    
    return {
      shared: true,
      transactionId: response.data.transactionId,
      message: response.data.message || 'Credential shared successfully',
    };
  } catch (error) {
    if (error.response) {
      throw new Error(
        `INJI Wallet API error: ${error.response.status} - ${error.response.data?.message || error.message}`
      );
    }
    throw new Error(`Failed to share credential to wallet: ${error.message}`);
  }
}

/**
 * Check if a credential has been shared to wallet
 * 
 * @param {string} credentialId - The credential ID
 * @param {string} accessToken - OAuth2 access token
 * @returns {Object} Sharing status
 */
async function checkWalletStatus(credentialId, accessToken) {
  if (!config.injiWallet.baseUrl || !config.injiWallet.apiKey) {
    return { shared: false };
  }

  try {
    const response = await axios.get(
      `${config.injiWallet.baseUrl}/api/v1/credentials/${credentialId}/wallet-status`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-API-Key': config.injiWallet.apiKey,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.warn('Failed to check wallet status:', error.message);
    return { shared: false };
  }
}

module.exports = {
  shareCredentialToWallet,
  checkWalletStatus,
};

