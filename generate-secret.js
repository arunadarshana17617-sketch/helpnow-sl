const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('base64');
console.log('Your NEXTAUTH_SECRET is:');
console.log(secret);