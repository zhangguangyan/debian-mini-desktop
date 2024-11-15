import { KJUR, KEYUTIL } from 'jsrsasign';

/**
 * Signs a JWT (JSON Web Token) using the ES256 algorithm and options.
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
  if (options.expiresIn) {
    payload.exp = Math.floor(Date.now() / 1000) + parseTimespan(options.expiresIn);
  }

  if (options.notBefore) {
    payload.nbf = Math.floor(Date.now() / 1000) + parseTimespan(options.notBefore);
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

  // Convert header and payload to JSON strings
  const sHeader = JSON.stringify(header);
  const sPayload = JSON.stringify(payload);

  // Sign the JWT
  const key = KEYUTIL.getKey(privateKeyPEM);
  const jwt = KJUR.jws.JWS.sign('ES256', sHeader, sPayload, key);

  return jwt;
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
MHcCAQEEIAjqbeVF7iTgflHzWUZY5eIYzi6Cv+8SzE98JCMZKj6joAoGCCqGSM49
AwEHoUQDQgAEgIjlo06M1Gg2z4A6jAEilYGubzC1VnEvf8jHhhTeXhj5L0YsBl+S
YAW3mN6WvUG6jQyyxXqU1BVJq8gklxG/0w==
-----END EC PRIVATE KEY-----
`;

const token = sign(
  { foo: 'bar' },
  privateKeyPEM,
  { expiresIn: '1h', algorithm: 'ES256' }
);

export default function () {
  console.log(token);
}
