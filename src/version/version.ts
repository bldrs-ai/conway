// Placeholder version for source/dev builds. CI's auto-publish job stamps the
// real `<major>.<commit-count>.<PR>-g<shorthash>` here (and into package.json)
// at publish time and does NOT commit it back to main — see
// .github/workflows/build.yml (auto-publish). So on main and in any unstamped
// local build this intentionally reads 1.0.0; only the first segment (major)
// is meaningful and is the one CI carries forward.
//
// A stamped string looks like 'Conway v1.1556.546-g3eae763'. The `-g<hash>`
// suffix is a semver prerelease identifier — the `g` prefix follows the
// `git describe` convention and is required, because semver forbids a leading
// zero in an all-numeric prerelease identifier (a hash like `0512345` would be
// an invalid version).
//
// Anything that parses this string must accept that optional 4th component.
// The parsers that do, as of conway#533:
//   - the CI stamp regex in .github/workflows/build.yml (auto-publish →
//     "Stamp version into package.json + version.ts"), which rewrites the
//     line below and therefore has to match the placeholder AND a
//     previously-stamped value;
//   - src/statistics/statistics.ts, which extracts the number for the CSV
//     header line.
// (src/compat/web-ifc/ifc_api.ts only logs and re-exports the string whole.)
const versionString: string = 'Conway v1.0.0'


export {versionString}
