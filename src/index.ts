import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  try {
    // Read the labels live: the event payload is a snapshot from when the event fired, so an
    // "opened" run misses a label added right after, and a re-run replays the stale snapshot.
    const octokit = github.getOctokit(core.getInput("github_token", {required: true}));
    const {data: labels} = await octokit.rest.issues.listLabelsOnIssue({
      ...github.context.repo,
      issue_number: github.context.payload!.pull_request!.number,
      per_page: 100,
    });
    const required_labels: string[] = (core.getInput("required_labels", {required: true}) !== "") ? (core.getInput("required_labels", {required: false})).split(",") : [];
    console.log(`PR Labels: ${JSON.stringify(labels)}`);

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
