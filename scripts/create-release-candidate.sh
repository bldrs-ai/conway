#!/usr/bin/env bash
set -euo pipefail

# Arguments:
# $1 = version bump type (major|minor)
# $2 = GitHub Personal Access Token (PAT)

if [ $# -ne 2 ]; then
    echo "Usage: yarn create-release-candidate <major|minor> <GitHub PAT>"
    exit 1
fi

BUMP_TYPE=$1
GITHUB_PAT=$2

# Validate bump type
if [ "$BUMP_TYPE" != "major" ] && [ "$BUMP_TYPE" != "minor" ]; then
    echo "Error: The first argument must be either 'major' or 'minor'."
    exit 1
fi

# Authenticate to GitHub's npm registry
echo "Authenticating to GitHub Packages..."
npm set //npm.pkg.github.com/:_authToken=$GITHUB_PAT

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
    sed -i '' "s/Conway Web-Ifc Shim v[0-9]*\.[0-9]*\.[0-9]*/Conway Web-Ifc Shim v$NEW_VERSION/" "$VERSION_FILE"
else
    echo "Error: Version file $VERSION_FILE not found!"
    exit 1
fi

echo "New version is $NEW_VERSION"

# Run the build-incremental script
echo "Running build-incremental"
yarn build-incremental

# Create a git tag for the new version without creating a commit
echo "Creating git tag $NEW_VERSION..."
git tag "$NEW_VERSION"

# Push the tag to the remote
git push origin "$NEW_VERSION"

# Publish to GitHub npm registry
echo "Publishing to GitHub npm registry..."
npm publish

echo "Release candidate created, tagged (no commit), and published successfully!"
