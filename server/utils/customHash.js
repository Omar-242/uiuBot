// hash function
export function hashPassword(password) {
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) + hash) + password.charCodeAt(i);
    hash = hash ^ (hash >> 13);
    hash = hash & 0xFFFFFFFF;
  }
  // post-mix step
  hash = ((hash << 7) ^ (hash >> 3)) & 0xFFFFFFFF;
  return 'h$' + Math.abs(hash).toString(16);
}

export function comparePassword(password, hashed) {
  return hashPassword(password) === hashed;
}
