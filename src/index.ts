import * as core from "@actions/core";
import * as github from "@actions/github";

// The event payload is a snapshot from when the event fired, so an "opened" run misses a label
// added right after, and a re-run replays the stale snapshot. Read the labels live instead, and
// fall back to the payload if the token can't read them (restricted permissions, fork PRs).
async function getLabels(): Promise<{name: string}[]> {
  const payloadLabels = github.context.payload.pull_request?.labels ?? [];
  const token = core.getInput("github_token");
  if (token === "" || github.context.issue.number === undefined) {
    return payloadLabels;
  }
  try {
    const octokit = github.getOctokit(token);
    return await octokit.paginate(octokit.rest.issues.listLabelsOnIssue, {
      ...github.context.repo,
      issue_number: github.context.issue.number,
      per_page: 100,
    });
  }
  catch (error: any) {
    core.warning(`Could not read labels from the API (${error.message}); using the event payload, which may be stale. Grant the token 'pull-requests: read' or 'issues: read'.`);
    return payloadLabels;
  }
}

async function run() {
  try {
    const labels = await getLabels();
    const required_labels: string[] = (core.getInput("required_labels", {required: true}) !== "") ? (core.getInput("required_labels", {required: false})).split(",") : [];
    console.log(`PR Labels: ${JSON.stringify(labels.map((l: any) => l.name))}`);

    // Check we have at least one of the required labels set.
    if (required_labels.length > 0 &&
    !required_labels.some(requiredLabel => labels.find((l: any) => l.name === requiredLabel)) ) {
      core.setFailed(`Please set at least one of the following labels on the PR: ${required_labels}`);
    }

    // Check to make sure we don't have more than one of the required labels set.
    if (required_labels.length > 0 &&
    (labels.filter((label: any) => required_labels.find((l) => l === label.name))).length > 1 ) {
      core.setFailed(`Please set ONLY ONE of the following labels: ${required_labels}`);
    }
  }
  catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
