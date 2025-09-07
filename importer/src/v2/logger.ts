const toBool = (v: string | undefined): boolean => /^(1|true|yes|on)$/i.test(v || '');

const DEBUG = toBool(process.env.DEBUG_V2);

export const debug = (...args: unknown[]) => {
  if (DEBUG) console.debug(...args);
};

export const info = (...args: unknown[]) => {
  console.log(...args);
};

export const warn = (...args: unknown[]) => {
  console.warn(...args);
};

export const error = (...args: unknown[]) => {
  console.error(...args);
};

