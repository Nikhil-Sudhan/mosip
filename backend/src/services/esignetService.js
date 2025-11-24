const axios = require('axios');
const config = require('../config');

/**
 * eSignet Service - Handles authentication with MOSIP eSignet
 * 
 * eSignet uses OpenID Connect (OIDC) for authentication.
 * This service provides simple functions to interact with eSignet APIs.
 */

/**
 * Get the authorization URL for OIDC login
 * User will be redirected to this URL to authenticate
 */
function getAuthorizationUrl(state = null) {
  const params = new URLSearchParams({
    client_id: config.esignet.clientId,
    redirect_uri: config.esignet.redirectUri,
    response_type: 'code',
    scope: config.esignet.scope,
    state: state || Date.now().toString(),
  });
  
  return `${config.esignet.baseUrl}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 * After user authenticates, eSignet redirects back with a code
 * We exchange this code for access token and ID token
 */
async function exchangeCodeForTokens(code) {
  try {
    const response = await axios.post(
      `${config.esignet.baseUrl}/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.esignet.redirectUri,
        client_id: config.esignet.clientId,
        client_secret: config.esignet.clientSecret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    return {
      accessToken: response.data.access_token,
      idToken: response.data.id_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  } catch (error) {
    throw new Error(`eSignet token exchange failed: ${error.message}`);
  }
}

/**
 * Get user info using access token
 * Returns user profile information from eSignet
 */
async function getUserInfo(accessToken) {
  try {
    const response = await axios.get(`${config.esignet.baseUrl}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get user info: ${error.message}`);
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken) {
  try {
    const response = await axios.post(
      `${config.esignet.baseUrl}/token`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.esignet.clientId,
        client_secret: config.esignet.clientSecret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    return {
      accessToken: response.data.access_token,
      idToken: response.data.id_token,
      refreshToken: response.data.refresh_token || refreshToken,
      expiresIn: response.data.expires_in,
    };
  } catch (error) {
    throw new Error(`Token refresh failed: ${error.message}`);
  }
}

/**
 * Verify ID token (basic verification)
 * In production, you should verify the JWT signature properly
 */
function verifyIdToken(idToken) {
  try {
    // Simple base64 decode - in production use proper JWT verification
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid ID token format');
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    throw new Error(`ID token verification failed: ${error.message}`);
  }
}

module.exports = {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  getUserInfo,
  refreshAccessToken,
  verifyIdToken,
};


