/**
 * Wallet build platforms and networks of the Releases global. Values are stable keys stored in
 * the database (download names map to them). Kept free of Payload imports: the admin row label
 * (a client component) uses them too.
 */
export const PLATFORMS = [
  { label: 'Windows (64-bit)', value: 'win64' },
  { label: 'Windows (32-bit)', value: 'win32' },
  { label: 'macOS (Intel)', value: 'macIntel' },
  { label: 'macOS (Apple Silicon)', value: 'macArm' },
  { label: 'Linux (AppImage)', value: 'linux' },
] as const

export const NETWORKS = [
  { label: 'Mainnet', value: 'mainnet' },
  { label: 'Testnet', value: 'testnet' },
] as const

export const platformLabel = (value: string | null | undefined) =>
  PLATFORMS.find((p) => p.value === value)?.label
