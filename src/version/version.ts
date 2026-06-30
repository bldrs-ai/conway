// Placeholder version for source/dev builds. CI's auto-publish job stamps the
// real `<major>.<PR>.<commit>` here (and into package.json) at publish time and
// does NOT commit it back to main — see .github/workflows/build.yml (auto-publish).
// So on main and in any unstamped local build this intentionally reads 1.0.0;
// only the first segment (major) is meaningful and is the one CI carries forward.
// Must stay in `vN.N.N` shape: the CI stamp regex, scripts/updateVersion.mjs, and
// statistics.ts all match `v\d+\.\d+\.\d+`.
const versionString: string = 'Conway Web-Ifc Shim v1.0.0'


export {versionString}
