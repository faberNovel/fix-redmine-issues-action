const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios')

async function commitsFromPullRequest(payload, token) {
  return (await axios.get(payload.pull_request._links.commits.href, {headers: {"Authorization": `Bearer ${token}`}})).data.map(restCommit => {
    return {message: restCommit.commit.message, url: restCommit.html_url}
  });
}

async function run() {
  try {
    const redmineUrl = core.getInput('redmine_url')
    const token = core.getInput('token')
    const payload = github.context.payload;
    console.log(`The event payload: ${(JSON.stringify(payload, undefined, 2))}`);

    const commits = payload.commits || await commitsFromPullRequest(payload, token);
    console.log(commits)
    await Promise.all(commits.map(async(commit) => {
      const regexp = /Fix +#(\d+)/g;
      for (const match of commit.message.matchAll(regexp)) {
        const issueId = match[1]
        const url = `${redmineUrl}/issues/${issueId}.json`;

        const issuePayload = {
          "issue": {
            "notes": `Update by ${payload.sender.login}\nGithub: ${commit.url}`,
            "done_ratio": 100,
            "status_id": core.getInput('status_id')
          }
        }

        console.log(url)
        console.log(JSON.stringify(issuePayload, undefined, 2))
        try {
          await axios.put(url, issuePayload, {headers: {"X-Redmine-API-Key": core.getInput('api_key')}})
        } catch (e) {
          console.log('error')
          console.log(e);
        }
        console.log('ok')
      }
    }))
  } catch (error) {
    console.log('error2')
    core.setFailed(error);
  }
  console.log('end')
}

run();
