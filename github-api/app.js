require("dotenv").config();

const token = process.env.TOKEN;
const login = process.env.LOGIN;
const repo = process.env.REPO;

const baseUrl = "https://api.github.com";

async function githubRequest(endpoint, method = "GET", body = null) {
    const options = {
        method,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
    };

    if (body !== null) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${baseUrl}${endpoint}`, options);

    if (response.status === 204) {
        return {
            status: response.status,
            message: "Operacja wykonana poprawnie"
        };
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message);
    }

    return data;
}

async function getUser() {
    return await githubRequest("/user");
}

async function getUserRepositories(username) {
    return await githubRequest(`/users/${username}/repos`);
}

async function createIssue(title, body) {
    return await githubRequest(`/repos/${login}/${repo}/issues`, "POST", { title, body });
}

async function createIssueComment(issueNumber, comment) {
    return await githubRequest(`/repos/${login}/${repo}/issues/${issueNumber}/comments`, "POST", { body: comment });
}

async function updateIssue(issueNumber, title, body) {
    return await githubRequest(`/repos/${login}/${repo}/issues/${issueNumber}`, "PATCH", { title, body });
}

async function updateIssueComment(commentId, comment) {
    return await githubRequest(`/repos/${login}/${repo}/issues/comments/${commentId}`, "PATCH", { body: comment });
}

async function deleteIssueComment(commentId) {
    return await githubRequest(`/repos/${login}/${repo}/issues/comments/${commentId}`, "DELETE");
}

function encodeBase64(text) {
    return Buffer.from(text).toString("base64");
}

async function createFile(path, content, message) {
    return await githubRequest(`/repos/${login}/${repo}/contents/${path}`, "PUT", {message, content: encodeBase64(content)});
}

async function getFile(path) {
    return await githubRequest(`/repos/${login}/${repo}/contents/${path}`);
}

async function deleteFile(path, message) {
    const file = await getFile(path);

    return await githubRequest(`/repos/${login}/${repo}/contents/${path}`, "DELETE", {message, sha: file.sha});
}

function waitForEnter() {
    return new Promise(resolve => {
        process.stdin.once("data", () => resolve());
    });
}

function getFileDateTime() {
    const now = new Date();

    return now.toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
}

async function main() {
    try {
        const user = await getUser();
        console.log("\nGET 1 - User:");
        console.log(user.login);

        const repos = await getUserRepositories(login);
        console.log("\nGET 2 - Repositories:");
        console.log(repos.map(repository => repository.name));

        const issueName = `Test Issue-${getFileDateTime()}.txt`
        const newIssue = await createIssue(issueName, "Testowy opis");
        console.log("\nPOST 1 - Created Issue:");
        console.log(newIssue.html_url);

        const commentName = `Test Comment-${getFileDateTime()}.txt`
        const newComment = await createIssueComment(newIssue.number, commentName);
        console.log("\nPOST 2 - Created Comment:");
        console.log(newComment.html_url);

        await waitForEnter();
        const updatedIssueName = `Updated Test Issue-${getFileDateTime()}.txt`
        const updatedIssue = await updateIssue(newIssue.number, updatedIssueName, "Zaktualizowany opis");
        console.log("\nPATCH 1 - Updated Issue:");
        console.log(updatedIssue.html_url);

        const updatedCommentName = `Updated Test Comment-${getFileDateTime()}.txt`
        const updatedComment = await updateIssueComment(newComment.id, "Zaktualizowany komentarz");
        console.log("\nPATCH 2 - Updated Comment:");
        console.log(updatedComment.html_url);

        await waitForEnter();
        const deletedComment = await deleteIssueComment(newComment.id);
        console.log("\nDELETE 1 - Deleted Comment:");
        console.log(deletedComment);

        const fileName = `test-${getFileDateTime()}.txt`;
        const createdFile = await createFile(fileName, "To jest testowy plik.", "Dodanie testowego pliku");
        console.log("\nPUT 1 - Created File:", createdFile.content.html_url);

        await waitForEnter();
        const deletedFile = await deleteFile(fileName, "Usunięcie testowego pliku");
        console.log("\nDELETE 2 - Deleted File:", deletedFile.commit.html_url);

    } catch (error) {
        console.error(error.message);
    }
}

main();

process.stdin.once("data", () => { });