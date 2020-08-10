const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios')

async function run() {
  try {
    const redmineUrl = core.getInput('redmine_url')
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);

    const issuePayload = {
      "issue": {
        "notes": `This issue has been fixed by ${payload['sender']['login']}`,
        "done_ratio": 100,
        "status_id": 3
      }
    }
    const issueId = 63040 // TODO
    await axios.post(`${redmineUrl}/issues/${issueId}.json`, issuePayload, {headers: {"X-Redmine-API-Key": core.getInput('api_key')}})
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
