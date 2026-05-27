#!/usr/bin/env bash
set -euo pipefail

# Arguments:
# $1 = version bump type (major|minor)

if [ $# -ne 1 ]; then
    echo "Usage: yarn create-release-candidate <major|minor>"
    exit 1
fi

BUMP_TYPE=$1

# Validate bump type
if [ "$BUMP_TYPE" != "major" ] && [ "$BUMP_TYPE" != "minor" ]; then
    echo "Error: The first argument must be either 'major' or 'minor'."
    exit 1
fi

# Extract the current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Bump version while preserving the patch version
if [ "$BUMP_TYPE" == "major" ]; then
    NEW_VERSION="$((MAJOR + 1)).$MINOR.$PATCH"
elif [ "$BUMP_TYPE" == "minor" ]; then
    NEW_VERSION="$MAJOR.$((MINOR + 1)).$PATCH"
fi

# Update package.json version
echo "Updating package.json version to $NEW_VERSION..."
npm version "$NEW_VERSION" --no-git-tag-version

# Update version in src/version/version.ts
VERSION_FILE="src/version/version.ts"
if [ -f "$VERSION_FILE" ]; then
    echo "Updating version in $VERSION_FILE to $NEW_VERSION..."
    # perl -i is portable across macOS (BSD) and Linux (GNU); sed -i is not.
    perl -i -pe "s/Conway Web-Ifc Shim v[0-9]+\.[0-9]+\.[0-9]+/Conway Web-Ifc Shim v$NEW_VERSION/" "$VERSION_FILE"
else
    echo "Error: Version file $VERSION_FILE not found!"
    exit 1
fi

echo "New version is $NEW_VERSION"

# Run the build-incremental script
echo "Running build-incremental"
yarn build-incremental

# Commit the version bump so the tag points to a real commit that
# matches package.json (otherwise the tag and the published package disagree).
echo "Committing version bump for $NEW_VERSION..."
git add package.json "$VERSION_FILE"
git commit -m "Bump version to $NEW_VERSION"

# Create a git tag on the bump commit
echo "Creating git tag $NEW_VERSION..."
git tag "$NEW_VERSION"

# Push the bump commit on the current branch, then the tag. The tag push
# triggers .github/workflows/publish.yml which builds and runs
# 'npm publish' from CI. Requires the NPM_TOKEN repo secret to be set;
# until then the publish workflow will fail loudly on the tag push.
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin "$CURRENT_BRANCH"
git push origin "$NEW_VERSION"

# Generate type docs (local artifact)
yarn typedoc

echo "Release candidate $NEW_VERSION tagged and pushed."
echo "CI will build and publish to npm on tag push:"
echo "  https://github.com/bldrs-ai/conway/actions/workflows/publish.yml"
