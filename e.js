import { EC } from 'elliptic';
import { encode as base64urlEncode } from 'k6/encoding';
import { sha256 } from 'k6/crypto';

/**
 * Signs a JWT (JSON Web Token) using the ES256 algorithm.
 *
 * @param {Object} payload - The payload to include in the JWT.
 * @param {string} privateKeyPEM - The ECDSA private key in PEM format.
 * @param {Object} [options] - Optional settings for the token.
 * @returns {string} - The signed JWT.
 */
function sign(payload, privateKeyPEM, options) {
  options = options || {};
  const header = {
    alg: 'ES256',
    typ: 'JWT',
  };

  // Add standard claims based on options
  const timestamp = Math.floor(Date.now() / 1000);

  if (options.expiresIn) {
    payload.exp = timestamp + parseTimespan(options.expiresIn);
  }

  if (options.notBefore) {
    payload.nbf = timestamp + parseTimespan(options.notBefore);
  }

  if (options.audience) {
    payload.aud = options.audience;
  }

  if (options.issuer) {
    payload.iss = options.issuer;
  }

  if (options.subject) {
    payload.sub = options.subject;
  }

  if (options.jwtid) {
    payload.jti = options.jwtid;
  }

  // Encode header and payload
  const encodedHeader = base64urlEncode(JSON.stringify(header), 'url');
  const encodedPayload = base64urlEncode(JSON.stringify(payload), 'url');

  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  // Remove PEM header/footer and newlines
  const privateKey = privateKeyPEM
    .replace('-----BEGIN EC PRIVATE KEY-----', '')
    .replace('-----END EC PRIVATE KEY-----', '')
    .replace(/\n/g, '');

  // Initialize elliptic curve
  const ec = new EC('p256'); // 'p256' corresponds to the 'prime256v1' curve used in ES256

  // Get key pair from the private key
  const key = ec.keyFromPrivate(privateKey, 'base64');

  // Hash the data to sign
  const msgHash = sha256(dataToSign, 'hex');

  // Sign the hashed data
  const signature = key.sign(msgHash, { canonical: true });

  // Concatenate r and s values and pad to 32 bytes each
  const r = signature.r.toArray('be', 32);
  const s = signature.s.toArray('be', 32);
  const joseSignature = new Uint8Array([...r, ...s]);

  // Encode the signature
  const encodedSignature = base64urlEncode(joseSignature, 'url');

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Parses a timespan string (e.g., '1h', '2d') into seconds.
 *
 * @param {string|number} time - The timespan to parse.
 * @returns {number} - The timespan in seconds.
 */
function parseTimespan(time) {
  if (typeof time === 'string') {
    const match = time.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid timespan format: ' + time);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        throw new Error('Unknown time unit: ' + unit);
    }
  } else if (typeof time === 'number') {
    return time;
  } else {
    throw new Error('Invalid timespan: ' + time);
  }
}

// Example usage:
const privateKeyPEM = `
-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIO60ZVkc3X0l1gkHJ1vMzBWqg8e5AK4Bpj45DKHClu2ToAoGCCqGSM49
AwEHoUQDQgAEMruGdY+11f8kqOD9NuvjuR5ZoIOkqg1SMVewZBZ75saaY50Lx4ZW
Y5RGsZjqNwbZjYzwYjrX5oYXrm8BvkC2xA==
-----END EC PRIVATE KEY-----
`;

export default function () {
  const token = sign(
    { foo: 'bar' },
    privateKeyPEM,
    { expiresIn: '1h' }
  );
  console.log(token);
}
