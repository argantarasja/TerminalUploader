const output = document.getElementById("output");
const commandInput = document.getElementById("command");

// ----------------- Modals -----------------
const uploadModal = document.getElementById("uploadModal");
const tokenInput = document.getElementById("tokenInput");
const repoInput = document.getElementById("repoInput");
const branchInput = document.getElementById("branchInput");
const selectFilesBtn = document.getElementById("selectFilesBtn");
const fileSelector = document.getElementById("fileSelector");
const uploadBtn = document.getElementById("uploadBtn");
const cancelBtn = document.getElementById("cancelBtn");
const modalTitle = document.getElementById("modalTitle");

const createRepoModal = document.getElementById("createRepoModal");
const createToken = document.getElementById("createToken");
const createRepoName = document.getElementById("createRepoName");
const createPrivate = document.getElementById("createPrivate");
const createBtn = document.getElementById("createBtn");
const createCancel = document.getElementById("createCancel");

const deleteRepoModal = document.getElementById("deleteRepoModal");
const deleteToken = document.getElementById("deleteToken");
const deleteRepoName = document.getElementById("deleteRepoName");
const deleteBtn = document.getElementById("deleteBtn");
const deleteCancel = document.getElementById("deleteCancel");

// New modals
const useRepoModal = document.getElementById("useRepoModal");
const useToken = document.getElementById("useToken");
const useRepo = document.getElementById("useRepo");
const useRepoBtn = document.getElementById("useRepoBtn");
const useRepoCancel = document.getElementById("useRepoCancel");

const createFileModal = document.getElementById("createFileModal");
const newFilePath = document.getElementById("newFilePath");
const newFileContent = document.getElementById("newFileContent");
const createFileBtn = document.getElementById("createFileBtn");
const createFileCancel = document.getElementById("createFileCancel");

const createFolderModal = document.getElementById("createFolderModal");
const newFolderPath = document.getElementById("newFolderPath");
const createFolderBtn = document.getElementById("createFolderBtn");
const createFolderCancel = document.getElementById("createFolderCancel");

const listReposModal = document.getElementById("listReposModal");
const listToken = document.getElementById("listToken");
const listReposBtn = document.getElementById("listReposBtn");
const listReposCancel = document.getElementById("listReposCancel");
const reposListOutput = document.getElementById("reposListOutput");

let selectedFile = null;
let currentRepo = null;
let currentToken = null;

// ----------------- Terminal Logging -----------------
function log(line = "") {
  output.innerText += line + "\n";
  output.scrollTop = output.scrollHeight;
}

// ----------------- Boot Sequence -----------------
function bootSequence() {
  const lines = ["Initializing system...", "Connecting to GitHub...", "Ready."];
  let i = 0;
  const interval = setInterval(() => {
    log(lines[i]);
    i++;
    if (i >= lines.length) clearInterval(interval);
  }, 300);
}

// ----------------- Commands -----------------
const commands = {
  help: () => `Available commands:
- upload         Upload single file to GitHub
- update         Update existing file in repo
- create-repo    Create new repository
- delete-repo    Delete repository
- use-repo       Select repo to work with
- create-file    Create new file in selected repo
- create-folder  Create new folder in selected repo
- list-repos     List your GitHub repositories
- clear          Clear terminal
- about          Show info`,
  about: () => "Terminal Uploader v5.0\nCreated by [Your Name]",
  clear: () => { output.innerText = ""; return ""; },
  upload: () => showUploadModal("📤 Upload File"),
  update: () => showUploadModal("✏️ Update File", true),
  "create-repo": () => { createRepoModal.style.display = "block"; },
  "delete-repo": () => { deleteRepoModal.style.display = "block"; },
  "use-repo": () => { useRepoModal.style.display = "block"; },
  "create-file": () => {
    if (!currentRepo || !currentToken) return log("❌ Select a repo first using 'use-repo'");
    createFileModal.style.display = "block";
  },
  "create-folder": () => {
    if (!currentRepo || !currentToken) return log("❌ Select a repo first using 'use-repo'");
    createFolderModal.style.display = "block";
  },
  "list-repos": () => { listReposModal.style.display = "block"; }
};

function executeCommand(cmd) {
  const fn = commands[cmd.trim().toLowerCase()];
  if (fn) {
    const result = fn();
    if (result) log(result);
  } else {
    log(`Command not found: ${cmd}`);
  }
}

// ----------------- Upload / Update -----------------
function showUploadModal(title, isUpdate=false) {
  modalTitle.innerText = title;
  uploadModal.style.display = "block";
  uploadModal.dataset.isUpdate = isUpdate;
}

selectFilesBtn.addEventListener("click", () => fileSelector.click());
fileSelector.addEventListener("change", (e) => { selectedFile = e.target.files[0]; log(`Selected file: ${selectedFile.name}`); });
cancelBtn.addEventListener("click", () => { uploadModal.style.display = "none"; selectedFile = null; });

uploadBtn.addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  const repoFullName = repoInput.value.trim();
  const branch = branchInput.value.trim() || "main";
  const isUpdate = uploadModal.dataset.isUpdate === "true";

  if (!token || !repoFullName || !selectedFile) return alert("Please fill all fields and select a file.");

  uploadModal.style.display = "none";
  await uploadFileToGitHub(token, repoFullName, branch, selectedFile, isUpdate);
  selectedFile = null;
});

// ----------------- GitHub API -----------------
async function uploadFileToGitHub(token, repoFullName, branch, file, isUpdate=false) {
  try {
    const content = await file.text();
    const encoded = btoa(unescape(encodeURIComponent(content)));
    const path = file.name;

    const checkRes = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${path}?ref=${branch}`, {
      headers: { Authorization: `token ${token}` }
    });

    let sha = null;
    if (checkRes.ok) {
      const data = await checkRes.json();
      sha = data.sha;
      if (!isUpdate) { log(`File exists. Use 'update' command to overwrite.`); return; }
    }

    const res = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: `${isUpdate ? "Update" : "Upload"} ${path}`, content: encoded, branch, sha })
    });

    if (res.ok) log(`✅ ${isUpdate ? "Updated" : "Uploaded"}: ${path}`);
    else { const err = await res.json(); log(`❌ Failed: ${path} (${err.message})`); }
  } catch (e) { log(`❌ Error: ${e.message}`); }
}

// ----------------- Create Repo -----------------
createBtn.addEventListener("click", async () => {
  const token = createToken.value.trim();
  const repoName = createRepoName.value.trim();
  const privateRepo = createPrivate.value === "true";

  if (!token || !repoName) return alert("Please fill all fields.");

  createRepoModal.style.display = "none";

  try {
    const res = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: repoName, private: privateRepo })
    });

    if (res.ok) log(`✅ Repository '${repoName}' created successfully!`);
    else { const err = await res.json(); log(`❌ Failed to create repo: ${err.message}`); }
  } catch (e) { log(`❌ Error: ${e.message}`); }
});
createCancel.addEventListener("click", () => createRepoModal.style.display = "none");

// ----------------- Delete Repo -----------------
deleteBtn.addEventListener("click", async () => {
  const token = deleteToken.value.trim();
  const repoFullName = deleteRepoName.value.trim();
  if (!token || !repoFullName) return alert("Please fill all fields.");

  deleteRepoModal.style.display = "none";

  try {
    const res = await fetch(`https://api.github.com/repos/${repoFullName}`, {
      method: "DELETE",
      headers: { Authorization: `token ${token}` }
    });

    if (res.status === 204) log(`✅ Repository '${repoFullName}' deleted successfully!`);
    else { const err = await res.json(); log(`❌ Failed to delete repo: ${err.message}`); }
  } catch (e) { log(`❌ Error: ${e.message}`); }
});
deleteCancel.addEventListener("click", () => deleteRepoModal.style.display = "none");

// ----------------- Use Repo -----------------
useRepoBtn.addEventListener("click", () => {
  const token = useToken.value.trim();
  const repo = useRepo.value.trim();
  if (!token || !repo) return alert("Please fill all fields.");

  currentRepo = repo;
  currentToken = token;
  useRepoModal.style.display = "none";
  log(`✅ Selected repo: ${repo}`);
});
useRepoCancel.addEventListener("click", () => useRepoModal.style.display = "none");

// ----------------- Create File -----------------
createFileBtn.addEventListener("click", async () => {
  const path = newFilePath.value.trim();
  const content = newFileContent.value;
  if (!path) return alert("Enter file path");

  createFileModal.style.display = "none";

  const encoded = btoa(unescape(encodeURIComponent(content)));
  try {
    const res = await fetch(`https://api.github.com/repos/${currentRepo}/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `token ${currentToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Create ${path}`, content: encoded })
    });

    if (res.ok) log(`✅ File '${path}' created successfully!`);
    else { const err = await res.json(); log(`❌ Failed: ${err.message}`); }
  } catch (e) { log(`❌ Error: ${e.message}`); }
});
createFileCancel.addEventListener("click", () => createFileModal.style.display = "none");

// ----------------- Create Folder -----------------
createFolderBtn.addEventListener("click", async () => {
  const path = newFolderPath.value.trim();
  if (!path) return alert("Enter folder path");

  createFolderModal.style.display = "none";

  const placeholder = btoa(unescape(encodeURIComponent(".gitkeep")));
  try {
    const res = await fetch(`https://api.github.com/repos/${currentRepo}/contents/${path}/.gitkeep`, {
      method: "PUT",
      headers: { Authorization: `token ${currentToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Create folder ${path}`, content: placeholder })
    });

    if (res.ok) log(`✅ Folder '${path}' created successfully!`);
    else { const err = await res.json(); log(`❌ Failed: ${err.message}`); }
  } catch (e) { log(`❌ Error: ${e.message}`); }
});
createFolderCancel.addEventListener("click", () => createFolderModal.style.display = "none");

// ----------------- List Repos -----------------
listReposBtn.addEventListener("click", async () => {
  const token = listToken.value.trim();
  if (!token) return alert("Enter GitHub token");

  reposListOutput.innerText = "Fetching...";
  try {
    const res = await fetch("https://api.github.com/user/repos", {
      headers: { Authorization: `token ${token}` }
    });
    const data = await res.json();
    if (res.ok) reposListOutput.innerText = data.map(r => r.full_name).join("\n");
    else reposListOutput.innerText = `❌ Error: ${data.message}`;
  } catch (e) { reposListOutput.innerText = `❌ Error: ${e.message}`; }
});
listReposCancel.addEventListener("click", () => listReposModal.style.display = "none");

// ----------------- Input Event -----------------
commandInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const cmd = commandInput.value;
    log(`> ${cmd}`);
    executeCommand(cmd);
    commandInput.value = "";
  }
});

// ----------------- Initialize -----------------
bootSequence();
