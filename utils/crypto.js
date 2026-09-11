// // const crypto = require('crypto');

// // const ALGORITHM = 'aes-256-gcm';
// // const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

// // const encrypt = (text) => {
// //   const iv = crypto.randomBytes(12); //Initialization Vector

// //   const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv); //cipher object , Create an AES-256-CBC encryption operation using this key and this IV.

// //   //process input
// //   let encrypted = cipher.update(text, 'utf8', 'hex'); //text->input string->bytes->output encrypted as hex , Take my UTF-8 text, encrypt it, and return the ciphertext as a hexadecimal string.

// //   //encryption
// //   encrypted += cipher.final('hex');

// //   // Get authentication tag
// //   const authTag = cipher.getAuthTag();

// //   // Store IV + encrypted data + authentication tag
// //   return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
// // };

// // const decrypt = (encryptedText) => {
// //   const [ivHex, encrypted, authTagHex] = encryptedText.split(':'); // Separate IV, encrypted data and authentication tag

// //   const iv = Buffer.from(ivHex, 'hex'); //back to buffer

// //   const authTag = Buffer.from(authTagHex, 'hex');

// //   const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

// //   decipher.setAuthTag(authTag); // Give GCM the authentication tag

// //   let decrypted = decipher.update(encrypted, 'hex', 'utf8');

// //   decrypted += decipher.final('utf8');

// //   console.log(decrypted);

// //   return decrypted;
// // };

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Store:
  // IV + Auth Tag + Encrypted Data
  return Buffer.concat([iv, authTag, encrypted]);
};

const decrypt = (encryptedData) => {
  // Extract IV
  const iv = encryptedData.subarray(0, IV_LENGTH);

  // Extract authentication tag
  const authTag = encryptedData.subarray(
    IV_LENGTH,
    IV_LENGTH + AUTH_TAG_LENGTH,
  );

  // Extract encrypted data
  const encrypted = encryptedData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};

module.exports = {
  encrypt,
  decrypt,
};

// //       KEY
// //        +
// //       IV
// //        +
// //    plaintext
// //        ↓
// //    encryption
// //        ↓
// //    ciphertext
// //encryption algorithms such as CBC work with fixed-size blocks.
// //encrypted data -> IV:ENCRYPTED_DATA
// // Encryption:
// // Plaintext + KEY + IV → Ciphertext
// // Decryption:
// // Ciphertext + KEY + IV → Plaintext
