/**
 * Paste your Google Apps Script web app URL below after deploying.
 * See SETUP.md for step-by-step instructions.
 */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxM9lthJCoadHZ6WvT37GTXBRcoE_3UOzZtC8kr7EcY6IhSs4lA_SvyzafXvGuIX7Lj/exec";

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
  const phone = document.getElementById("phone") ? document.getElementById("phone").value.trim() : "";
  const birthdate = document.getElementById("birthdate") ? document.getElementById("birthdate").value : "";

  if (!name || !email) {
    showStatus("Please fill in all required fields.", "error");
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
    phone: phone,
    birthdate: birthdate,
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

    if (data && (data.result === "success" || data.status === "success")) {
      markSignedUp();
      showStatus("Thanks! Your signup was recorded. Entering…", "success");
      form.reset();
      setTimeout(function () {
        window.location.replace("index.html");
      }, 800);
      return;
    } else if (data && data.error) {
      showStatus(data.error, "error");
      return;
    } else if (response.ok) {
      markSignedUp();
      showStatus("Thanks! Your signup was recorded. Entering…", "success");
      form.reset();
      setTimeout(function () {
        window.location.replace("index.html");
      }, 800);
      return;
    } else {
      showStatus("Server responded with an error. Please try again.", "error");
    }
  } catch (err) {
    console.warn("Standard fetch encountered an issue, attempting fallback transmission:", err);
    try {
      // Fallback: mode "no-cors" sends the data to Apps Script without tripping redirect-blocking policies
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });
      markSignedUp();
      showStatus("Thanks! Your signup was recorded. Entering…", "success");
      form.reset();
      setTimeout(function () {
        window.location.replace("index.html");
      }, 800);
    } catch (fallbackErr) {
      showStatus(
        "Could not reach the signup server. Check your connection and SCRIPT_URL.",
        "error"
      );
    }
  } finally {
    submitBtn.disabled = false;
  }
});
