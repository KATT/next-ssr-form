export function assertOnServer(desc?: string) {
  if (typeof window !== 'undefined') {
    throw new Error(
      'Imported server-only functionality on client' + desc ? ` (${desc})` : '',
    );
  }
}

