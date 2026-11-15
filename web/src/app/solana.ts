// Links to the public Solana explorer, on the test network the game uses.
// Sarah: the reward card can use explorerTxUrl(award.txSignature) when award.chainStatus is 'sent'.

/** The page for one transaction: one award. */
export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`
}

/** The page for one address: a player's points wallet. */
export function explorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${encodeURIComponent(address)}/tokens?cluster=devnet`
}
