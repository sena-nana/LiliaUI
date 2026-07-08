export function calculateNextVersion(currentVersion, requestedVersion) {
  const current = parseVersion(currentVersion);
  if (!current) {
    throw new Error(`Invalid semantic version: ${currentVersion}`);
  }

  if (requestedVersion === "patch" || requestedVersion === "minor" || requestedVersion === "major") {
    return bump(current, requestedVersion);
  }

  const target = parseVersion(requestedVersion);
  if (!target) {
    throw new Error(`Invalid semantic version: ${requestedVersion}`);
  }
  if (!greaterThan(target, current)) {
    throw new Error(
      `The requested version ${requestedVersion} is not greater than current ${current.version}.`,
    );
  }
  return target.version;
}

function bump(current, type) {
  const { major, minor, patch } = current;
  if (type === "patch") return `${major}.${minor}.${patch + 1}`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  if (type === "major") return `${major + 1}.0.0`;
  throw new Error(`Unsupported bump level: ${type}`);
}

function parseVersion(version) {
  const match = version?.match(/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  if (!match) return null;
  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
    version: `${match[1]}.${match[2]}.${match[3]}`,
  };
}

function greaterThan(a, b) {
  if (a.major !== b.major) return a.major > b.major;
  if (a.minor !== b.minor) return a.minor > b.minor;
  return a.patch > b.patch;
}
