const axios = require('axios');
const config = require('../config');

/**
 * INJI Certify Service - Handles Verifiable Credential generation
 * 
 * This service interacts with INJI Certify APIs to:
 * - Issue Verifiable Credentials (VCs)
 * - Sign credentials with real cryptographic signatures
 * - Manage credential templates
 */

/**
 * Issue a Verifiable Credential using INJI Certify
 * 
 * @param {Object} credentialData - The credential data to issue
 * @param {string} credentialData.credentialSubject - The subject of the credential
 * @param {string} credentialData.type - Credential type (e.g., 'DigitalProductPassport')
 * @param {string} accessToken - OAuth2 access token for authentication
 * @returns {Object} The issued Verifiable Credential
 */
async function issueCredential(credentialData, accessToken) {
  try {
    const response = await axios.post(
      `${config.injiCertify.baseUrl}/api/v1/credentials/issue`,
      {
        credential: {
          '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://schema.org',
            'https://mosip.io/dpp/v1',
          ],
          type: credentialData.type || ['VerifiableCredential', 'DigitalProductPassport'],
          issuer: config.injiCertify.issuerDid,
          credentialSubject: credentialData.credentialSubject,
          issuanceDate: new Date().toISOString(),
          expirationDate: credentialData.expirationDate,
        },
        options: {
          proofPurpose: 'assertionMethod',
          verificationMethod: `${config.injiCertify.issuerDid}#key-1`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-API-Key': config.injiCertify.apiKey,
        },
      }
    );
    
    return response.data.verifiableCredential;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `INJI Certify API error: ${error.response.status} - ${error.response.data?.message || error.message}`
      );
    }
    throw new Error(`Failed to issue credential: ${error.message}`);
  }
}

/**
 * Get credential template by ID
 */
async function getTemplate(templateId, accessToken) {
  try {
    const response = await axios.get(
      `${config.injiCertify.baseUrl}/api/v1/templates/${templateId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-API-Key': config.injiCertify.apiKey,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get template: ${error.message}`);
  }
}

/**
 * List all available credential templates
 */
async function listTemplates(accessToken) {
  try {
    const response = await axios.get(
      `${config.injiCertify.baseUrl}/api/v1/templates`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-API-Key': config.injiCertify.apiKey,
        },
      }
    );
    
    return response.data.templates || [];
  } catch (error) {
    throw new Error(`Failed to list templates: ${error.message}`);
  }
}

/**
 * Verify a Verifiable Credential signature
 * Uses INJI Certify's verification endpoint
 */
async function verifyCredential(credential, accessToken) {
  try {
    const response = await axios.post(
      `${config.injiCertify.baseUrl}/api/v1/credentials/verify`,
      {
        verifiableCredential: credential,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-API-Key': config.injiCertify.apiKey,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `Verification failed: ${error.response.status} - ${error.response.data?.message || error.message}`
      );
    }
    throw new Error(`Failed to verify credential: ${error.message}`);
  }
}

module.exports = {
  issueCredential,
  getTemplate,
  listTemplates,
  verifyCredential,
};


