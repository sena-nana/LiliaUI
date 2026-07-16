export type VersionBump = "patch" | "minor" | "major";

export function calculateNextVersion(currentVersion: string, request: VersionBump | string): string;
