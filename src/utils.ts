export async function debug(message: string) {
  const time = new Date().toISOString();
  if (process.env.NODE_ENV === "development") {
    console.debug(`[${time}] ${message}`);
  }
}

export async function info(message: string) {
  const time = new Date().toISOString();
  console.log(`[${time}] ${message}`);
}

export async function error(message: string, error?: unknown) {
  const time = new Date().toISOString();
  console.error(`[${time}] ${message}`, error);
}
