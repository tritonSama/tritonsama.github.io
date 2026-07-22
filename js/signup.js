/**
 * Paste your Google Apps Script web app URL below after deploying.
 * See SETUP.md for step-by-step instructions.
 */
const SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

const form = document.getElementById("signupForm");
const statusEl = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = "form-status " + type;
}

function isConfigured() {
  return (
    SCRIPT_URL &&
    !SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT")
  );
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const birthdate = document.getElementById("birthdate").value;
  const birthtime = document.getElementById("birthtime").value;

  if (!name || !email || !birthdate || !birthtime) {
    showStatus("Please fill in all fields.", "error");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showStatus("Please enter a valid email address.", "error");
    return;
  }

  if (!isConfigured()) {
    showStatus(
      "Signup is not connected yet. Set SCRIPT_URL in js/signup.js (see SETUP.md).",
      "error"
    );
    return;
  }

  const payload = {
    name: name,
    email: email,
    birthdate: birthdate,
    birthtime: birthtime,
  };

  submitBtn.disabled = true;
  showStatus("Submitting…", "success");

  try {
    // text/plain avoids a CORS preflight; Apps Script still receives the body.
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(function () {
      return null;
    });

    if (response.ok && data && data.result === "success") {
      markSignedUp();
      showStatus("Thanks! Your signup was recorded. Entering…", "success");
      form.reset();
      window.location.replace("index.html");
    } else {
      const detail =
        data && data.error ? data.error : "Something went wrong. Try again.";
      showStatus(detail, "error");
    }
  } catch (err) {
    showStatus(
      "Could not reach the signup server. Check your connection and SCRIPT_URL.",
      "error"
    );
  } finally {
    submitBtn.disabled = false;
  }
});
