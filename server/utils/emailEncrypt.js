
const SECRET = 0x5a5a5a5a; // simple static key

export function encryptEmail(email) {
  let enc = [];
  for (let i = 0; i < email.length; i++) {
    enc.push((email.charCodeAt(i) ^ (SECRET & 0xff)).toString(16).padStart(2, '0'));
  }
  return enc.join('');
}

export function decryptEmail(enc) {
  let email = '';
  for (let i = 0; i < enc.length; i += 2) {
    let code = parseInt(enc.substr(i, 2), 16) ^ (SECRET & 0xff);
    email += String.fromCharCode(code);
  }
  return email;
}
