export const bunCryptoFix = () => {
  if (typeof Bun === "undefined") {
    return;
  }
  const fixAlgo = (algo: unknown): any =>
    algo === "NODE-ED25519" ||
    (algo &&
      typeof algo === "object" &&
      "name" in algo &&
      algo.name === "NODE-ED25519")
      ? "Ed25519"
      : algo;
  const _importKey = SubtleCrypto.prototype.importKey;
  const _verify = crypto.subtle.verify;
  SubtleCrypto.prototype.importKey = function importKey(
    format: never,
    keyData: never,
    algorithm: never,
    extractable: never,
    keyUsages: never,
  ) {
    return _importKey.apply(this, [
      format,
      keyData,
      fixAlgo(algorithm),
      extractable,
      keyUsages,
    ]);
  };
  SubtleCrypto.prototype.verify = function verify(
    algorithm,
    key,
    signature,
    data,
  ) {
    return _verify.apply(this, [fixAlgo(algorithm), key, signature, data]);
  };
};
