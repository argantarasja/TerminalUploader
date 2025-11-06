const output = document.getElementById("output");
const commandInput = document.getElementById("command");

const uploadModal = document.getElementById("uploadModal");
const tokenInput = document.getElementById("tokenInput");
const repoInput = document.getElementById("repoInput");
const branchInput = document.getElementById("branchInput");
const selectFilesBtn = document.getElementById("selectFilesBtn");
const fileSelector = document.getElementById("fileSelector");
const uploadBtn = document.getElementById("uploadBtn");
const cancelBtn = document.getElementById("cancelBtn");

let selectedFiles = [];

function log(line) {
  output.innerText += line + "\n";
  output.scrollTop = output.scrollHeight;
}

function bootSequence() {
  const lines = ["Initializing system...", "Connecting to GitHub...", "Ready."];
  let i = 0;
  const interval = setInterval(() => {
    log(lines[i]);
    i++;
    if (i === lines.length) clearInterval(interval);
  }, 500);
}

const commands = {
  help: () => "Available commands:\n- upload\n- clear\n- about",
  about: () => "Terminal Uploader v2.0\nCreated by [Your Name]\nSupports automatic repo creation and overwrite upload.",
  clear: () => (output.innerText = ""),
  upload: () => {
    uploadModal.style.display = "block";
  },
};

async function ensureRepoExists(token, repoFullName) {
  const [owner, repo] = repoFullName.split("/");
  const check = await fetch(`https://api.github.com/repos/${repoFullName}`, {
    headers: { Authorization: `token ${token}` },
  });

  if (check.status === 404) {
    log(`Repository not found. Creating new repo: ${repo}...`);
    const create = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: repo, private: false }),
    });
    if (create.ok) {
      log(`✅ Repository created successfully!`);
    } else {
      log(`❌ Failed to create repository.`);
      throw new Error("Repo creation failed");
    }
  }
}

async function uploadFileToGitHub(token, repoFullName, branch, file) {
  const content = await file.text();
  const encoded = btoa(unescape(encodeURIComponent(content)));
  const filePath = file.name;

  // Check if file already exists
  const resCheck = await fetch(
    `https://api.github.com/repos/${repoFullName}/contents/${filePath}?ref=${branch}`,
    { headers: { Authorization: `token ${token}` } }
  );

  let sha = null;
  if (resCheck.ok) {
    const data = await resCheck.json();
    sha = data.sha;
  }

  const uploadRes = await fetch(
    `https://api.github.com/repos/${repoFullName}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Upload ${filePath}`,
        content: encoded,
        branch,
        sha,
      }),
    }
  );

  if (uploadRes.ok) {
    log(`✅ Uploaded: ${filePath}`);
  } else {
    const err = await uploadRes.json();
    log(`❌ Failed: ${filePath} (${err.message})`);
  }
}

selectFilesBtn.addEventListener("click", () => fileSelector.click());
fileSelector.addEventListener("change", (e) => {
  selectedFiles = Array.from(e.target.files);
  log(`Selected ${selectedFiles.length} file(s).`);
});

cancelBtn.addEventListener("click", () => {
  uploadModal.style.display = "none";
  selectedFiles = [];
});

uploadBtn.addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  const repoFullName = repoInput.value.trim();
  const branch = branchInput.value.trim();

  if (!token || !repoFullName || selectedFiles.length === 0) {
    alert("Please fill all fields and select files.");
    return;
  }

  uploadModal.style.display = "none";
  log(`Starting upload to ${repoFullName}/${branch}...`);

  try {
    await ensureRepoExists(token, repoFullName);
    for (const file of selectedFiles) {
      await uploadFileToGitHub(token, repoFullName, branch, file);
    }
    log("✅ Upload process completed.");
  } catch (err) {
    log(`❌ Upload failed: ${err.message}`);
  }

  selectedFiles = [];
});

commandInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const cmd = commandInput.value.trim();
    log(`> ${cmd}`);
    commandInput.value = "";
    if (cmd in commands) {
      const result = await commands[cmd]();
      if (result) log(result);
    } else if (cmd) {
      log(`Command not found: ${cmd}`);
    }
  }
});

bootSequence();
