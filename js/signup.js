/**
 * HBLite — Signup & Login Controller
 * Built exclusively on the Atlantis & Lemuria network.
 */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxM9lthJCoadHZ6WvT37GTXBRcoE_3UOzZtC8kr7EcY6IhSs4lA_SvyzafXvGuIX7Lj/exec";

const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const statusEl = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");

function showStatus(message, type) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = "form-status " + type;
}

function clearStatus() {
  if (!statusEl) return;
  statusEl.textContent = "";
  statusEl.className = "form-status";
}

function deriveAtlantisDid(seedStr) {
  var seed = String(seedStr || "client") + "_atlantis_lemuria";
  var h1 = 0x811c9dc5;
  var h2 = 0xcbf29ce4;
  for (var i = 0; i < seed.length; i++) {
    var c = seed.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= c * 31;
    h2 = Math.imul(h2, 0x01000193) >>> 0;
  }
  var hex =
    h1.toString(16).padStart(8, "0") +
    h2.toString(16).padStart(8, "0") +
    (h1 ^ 0xa5a5a5a5 >>> 0).toString(16).padStart(8, "0") +
    (h2 ^ 0x5a5a5a5a >>> 0).toString(16).padStart(8, "0");
  return "did:atlantis:" + hex;
}

window.switchAuthTab = function (mode) {
  clearStatus();
  var tabSignupBtn = document.getElementById("tabSignupBtn");
  var tabLoginBtn = document.getElementById("tabLoginBtn");
  if (mode === "login") {
    if (signupForm) signupForm.classList.add("hidden");
    if (loginForm) loginForm.classList.remove("hidden");
    if (tabSignupBtn) tabSignupBtn.classList.remove("active");
    if (tabLoginBtn) tabLoginBtn.classList.add("active");
  } else {
    if (loginForm) loginForm.classList.add("hidden");
    if (signupForm) signupForm.classList.remove("hidden");
    if (tabLoginBtn) tabLoginBtn.classList.remove("active");
    if (tabSignupBtn) tabSignupBtn.classList.add("active");
  }
};

window.enterInstantClientEvaluation = function () {
  var did = deriveAtlantisDid("prospective_client_" + Date.now());
  var session = {
    name: "Prospective Client",
    email: "evaluation@atlantis.network",
    did: did,
    role: "Enterprise / Commercial Client",
    nodeTier: "Tier 2: Pelagic Node",
    authenticatedAt: new Date().toISOString()
  };
  markSignedUp(session);
  showStatus("Atlantis evaluation identity provisioned (" + did.substring(0, 22) + "…). Launching HBLite…", "success");
  setTimeout(function () {
    window.location.replace("index.html");
  }, 500);
};

// Check URL params for ?mode=login
(function initTabFromQuery() {
  var search = window.location.search || "";
  if (search.indexOf("mode=login") !== -1) {
    window.switchAuthTab("login");
  }
})();

if (signupForm) {
  signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password") ? document.getElementById("password").value : "";
    const guildClass = document.getElementById("guildClass")
      ? document.getElementById("guildClass").value
      : "Enterprise / Commercial Client";
    const phone = document.getElementById("phone") ? document.getElementById("phone").value.trim() : "";

    if (!name || !email || !password) {
      showStatus("Please fill in your name, email address, and access passkey.", "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showStatus("Please enter a valid email address.", "error");
      return;
    }

    if (password.length < 6) {
      showStatus("Access passkey must be at least 6 characters.", "error");
      return;
    }

    const isAdminUser = email.toLowerCase() === "blue-aquarius@live.com";
    const assignedRole = isAdminUser
      ? "Network Administrator / Citadel Overseer"
      : guildClass;

    const did = deriveAtlantisDid(email);
    const session = {
      name: name,
      email: email,
      did: did,
      role: assignedRole,
      phone: phone,
      isAdmin: isAdminUser,
      nodeTier: isAdminUser ? "Tier 0: Root Citadel Overseer" : "Tier 2: Pelagic Node",
      authenticatedAt: new Date().toISOString()
    };

    // Save locally for instant sign-in & persistence
    saveRegisteredUser({
      name: name,
      email: email,
      password: password,
      did: did,
      role: assignedRole,
      phone: phone,
      isAdmin: isAdminUser
    });

    const payload = {
      action: "beta_signup",
      name: name,
      email: email,
      guildClass: assignedRole,
      role: assignedRole,
      phone: phone,
      did: did,
      timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()
    };

    if (submitBtn) submitBtn.disabled = true;
    showStatus("Provisioning Atlantis DID & recording registration…", "success");

    try {
      if (SCRIPT_URL && !SCRIPT_URL.includes("PASTE_YOUR")) {
        // Multi-strategy sync: URL params fallback and no-cors POST
        const queryParams = new URLSearchParams({
          action: "beta_signup",
          name: name,
          email: email,
          guildClass: assignedRole,
          phone: phone,
          did: did
        }).toString();

        await Promise.race([
          fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(payload)
          }),
          // Secondary fallback attempt via GET query parameters
          fetch(SCRIPT_URL + "?" + queryParams, {
            method: "GET",
            mode: "no-cors"
          }).catch(() => {})
        ]);
      }
    } catch (err) {
      console.warn("Remote ledger sync fallback:", err);
    } finally {
      markSignedUp(session);
      showStatus("Identity verified (" + did.substring(0, 22) + "…). Entering HBLite…", "success");
      signupForm.reset();
      setTimeout(function () {
        window.location.replace("index.html");
      }, 650);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const identifier = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!identifier || !password) {
      showStatus("Please enter both your Email / Atlantis DID and passkey.", "error");
      return;
    }

    if (loginSubmitBtn) loginSubmitBtn.disabled = true;

    const existing = findRegisteredUser(identifier);
    if (existing && existing.password && existing.password !== password) {
      showStatus("Invalid passkey for this registered account.", "error");
      if (loginSubmitBtn) loginSubmitBtn.disabled = false;
      return;
    }

    const did = existing
      ? existing.did
      : identifier.startsWith("did:atlantis:")
      ? identifier
      : deriveAtlantisDid(identifier);

    const displayName = existing
      ? existing.name
      : identifier.includes("@")
      ? identifier.split("@")[0]
      : "Atlantis Client";

    const userEmail = existing ? existing.email : identifier;
    const isAdminUser = (userEmail || "").toLowerCase() === "blue-aquarius@live.com";
    const assignedRole = isAdminUser
      ? "Network Administrator / Citadel Overseer"
      : (existing ? existing.role : "Enterprise / Commercial Client");

    const session = {
      name: displayName,
      email: userEmail,
      did: did,
      role: assignedRole,
      isAdmin: isAdminUser,
      nodeTier: isAdminUser ? "Tier 0: Root Citadel Overseer" : "Tier 2: Pelagic Node",
      authenticatedAt: new Date().toISOString()
    };

    markSignedUp(session);
    showStatus("Authenticated as " + displayName + " (" + did.substring(0, 22) + "…). Launching HBLite…", "success");

    setTimeout(function () {
      window.location.replace("index.html");
    }, 550);
  });
}
