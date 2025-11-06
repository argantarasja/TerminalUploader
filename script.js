const output = document.getElementById("output");
const commandInput = document.getElementById("command");

// Modal Elements
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

let selectedFile = null;

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
  help: () => {
    return "Available commands:\n- upload      Upload single file to GitHub\n- update      Update existing file in repo\n- create-repo Create new repository\n- clear       Clear terminal\n- about       Show info";
  },
  about: () => "Terminal Uploader v4.0\nCreated by [Your Name]",
  clear: () => { output.innerText = ""; },
  upload: () => { showUploadModal("📤 Upload File"); },
  update: () => { showUploadModal("✏️ Update File", true); },
  "create-repo": () => { createRepoModal.style.display = "block"; }
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

fileSelector.addEventListener("change", (e) => {
  selectedFile = e.target.files[0];
  log(`Selected file: ${selectedFile.name}`);
});

cancelBtn.addEventListener("click", () => {
  uploadModal.style.display = "none";
  selectedFile = null;
});

uploadBtn.addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  const repoFullName = repoInput.value.trim();
  const branch = branchInput.value.trim() || "main";
  const isUpdate = uploadModal.dataset.isUpdate === "true";

  if (!token || !repoFullName || !selectedFile) {
    alert("Please fill all fields and select a file.");
    return;
  }

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

    // Check if file exists
    const checkRes = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${path}?ref=${branch}`, {
      headers: { Authorization: `token ${token}` }
    });

    let sha = null;
    if (checkRes.ok) {
      const data = await checkRes.json();
      sha = data.sha;
      if (!isUpdate) {
        log(`File exists. Use 'update' command to overwrite.`);
        return;
      }
    }

    const res = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `${isUpdate ? "Update" : "Upload"} ${path}`,
        content: encoded,
        branch,
        sha
      })
    });

    if (res.ok) log(`✅ ${isUpdate ? "Updated" : "Uploaded"}: ${path}`);
    else {
      const err = await res.json();
      log(`❌ Failed: ${path} (${err.message})`);
    }
  } catch (e) {
    log(`❌ Error: ${e.message}`);
  }
}

// ----------------- Create Repo -----------------
createBtn.addEventListener("click", async () => {
  const token = createToken.value.trim();
  const repoName = createRepoName.value.trim();
  const privateRepo = createPrivate.value === "true";

  if (!token || !repoName) {
    alert("Please fill all fields.");
    return;
  }

  createRepoModal.style.display = "none";
  try {
    const res = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: repoName, private: privateRepo })
    });
    if (res.ok) log(`✅ Repository '${repoName}' created successfully!`);
    else {
      const err = await res.json();
      log(`❌ Failed to create repo: ${err.message}`);
    }
  } catch (e) {
    log(`❌ Error: ${e.message}`);
  }
});

createCancel.addEventListener("click", () => createRepoModal.style.display = "none");

// ----------------- Terminal Input -----------------
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
