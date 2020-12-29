export function assertOnServer(desc?: string) {
  if (process.browser) {
    throw new Error(
      'Imported server-only functionality on client' + desc ? ` (${desc})` : ''
    );
  }
}
