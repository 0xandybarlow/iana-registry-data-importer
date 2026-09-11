export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

const STABLE_SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export const parseStableVersion = (value: string): SemVer => {
  const match = STABLE_SEMVER.exec(value);
  if (!match) {
    throw new Error(
      `Expected a stable SemVer major.minor.patch, received ${value}`,
    );
  }

  const version = {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
  if (Object.values(version).some((part) => !Number.isSafeInteger(part))) {
    throw new Error(
      `Expected a stable SemVer major.minor.patch, received ${value}`,
    );
  }
  return version;
};

export const nextPatch = (value: string): string => {
  const { major, minor, patch } = parseStableVersion(value);
  if (patch === Number.MAX_SAFE_INTEGER) {
    throw new Error(`Cannot increment patch for stable SemVer ${value}`);
  }
  return `${major}.${minor}.${patch + 1}`;
};
