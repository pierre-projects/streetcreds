// A dedicated Solana address usually carries an access key, in its query string or its path.
// Error messages from the network library often quote the address they failed to reach, so
// anything that is logged or printed goes through this first.

/** Returns `text` with the Solana address, and any key inside it, taken out. */
export function redactRpcUrl(text: string, rpcUrl: string): string {
  if (rpcUrl === '') return text;
  let out = text.split(rpcUrl).join('[solana address]');
  try {
    const url = new URL(rpcUrl);
    // A key can still appear on its own, when a message quotes the address in another form.
    const pieces = [...url.searchParams.values(), ...url.pathname.split('/')];
    for (const piece of pieces) {
      // Short path pieces such as "v2" are not keys, and removing them would garble the message.
      if (piece.length >= 12) out = out.split(piece).join('[hidden]');
    }
  } catch {
    // Not a valid address. Removing the exact text above is all that can be done.
  }
  return out;
}
