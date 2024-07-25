// 来自：https://modernjs.dev/v1/docs/guides/features/changesets/commit

async function getAddMessage(changeset) {
  const releasesLines = changeset.releases
    .map(release => `  - ${release.name}: ${release.type}`)
    .join('\n');

  return `${changeset.summary}

Releases:
${releasesLines}
`;
};


async function getVersionMessage(releasePlan) {
  const publishableReleases = releasePlan.releases.filter(release => release.type !== 'none');

  const releasesLines = publishableReleases
    // .map(release => `  ${release.name}@${release.oldVersion} => ${release.name}@${release.newVersion}`)
    .map(release => `  - ${release.name}@${release.newVersion}`)
    .join('\n');

  return `
RELEASING: Releasing ${publishableReleases.length} package(s)
Releases:
${releasesLines}
`;
};


module.exports = {
  getAddMessage,
  getVersionMessage,
};
