# Enforce Labels

A Github action to enforce labeling a pull request with specified labels.

## Inputs
- **required_labels:** A list of labels that at least one is required on the pull request.
- **github_token:** Token used to read the pull request's current labels from the API. Defaults to `github.token`, which needs `pull-requests: read` or `issues: read` (the default token has this unless the workflow or repo restricts permissions). If the API call fails, the action logs a warning and falls back to the labels in the event payload. That snapshot can be stale: a PR labeled just after it was opened fails its `opened` run, and re-running replays the same snapshot.

## Outputs
Currently there are no outputs defined for this workflow.

## Secrets
This action does not need any extra secrets. It uses the workflow's `github.token` to read labels.

## Usage
Learn more about GitHub Actions in general [here](https://docs.github.com/en/actions/quickstart).

To use this action in your repo, follow these steps:

 1. Create a YAML file in the `.github/workflows/` directory of your repo.
 2. Copy the following into the YAML file:
```yaml
---
name: Enforce Labeling
on:
  pull_request_target:
    types: [opened, synchronize, reopened, labeled, unlabeled]
    branches:
      - main
  workflow_dispatch:

jobs:
  check_labels:
    runs-on: ubuntu-latest
    steps:
      - name: Check Pull Request Labels
        uses: discoverygarden/enforce-label@main
        with:
          required_labels: major,minor,patch,no-update
```
The labels provided in this case are our typical semantic version tagging labels, as well as a `no-update` label that will not initiate the semantic tagging workflow, in the rare case we don't want to initiate the workoflow.

The `types` on the `pull_request_target` are the base conditions `[opened, synchronize, reopened]` as well as two scenarios `[labeled, unlabeled]` which we want to track as we're specifically dealing with labels.
