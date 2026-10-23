/**
 * HBLite — Client-side authentication & session gate for static hosting.
 * Built exclusively on the Atlantis & Lemuria network.
 */
var HBLITE_SESSION_KEY = "hblite_session";
var HBLITE_USERS_KEY = "hblite_registered_users";
var LEGACY_SIGNUP_KEY = "slipstream_signed_up";

function getActiveSession() {
  try {
    var raw = localStorage.getItem(HBLITE_SESSION_KEY);
    if (!raw) return null;
    var sess = JSON.parse(raw);
    if (sess && sess.email && sess.email.toLowerCase() === "blue-aquarius@live.com") {
      sess.isAdmin = true;
      sess.role = "Network Administrator / Citadel Overseer";
    }
    return sess;
  } catch (e) {
    return null;
  }
}

function isAdminSession() {
  var sess = getActiveSession();
  return !!(sess && (sess.isAdmin || (sess.email && sess.email.toLowerCase() === "blue-aquarius@live.com")));
}

function hasSignedUp() {
  try {
    return (
      getActiveSession() !== null ||
      localStorage.getItem(LEGACY_SIGNUP_KEY) === "1"
    );
  } catch (e) {
    return false;
  }
}

function markSignedUp(sessionData) {
  try {
    var session = sessionData || {
      name: "Operative",
      email: "client@atlantis.network",
      did: "did:atlantis:7f8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
      role: "Client / Partner",
      nodeTier: "Tier 2: Pelagic Node",
      authenticatedAt: new Date().toISOString()
    };
    localStorage.setItem(HBLITE_SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(LEGACY_SIGNUP_KEY, "1");
  } catch (e) {}
}

function clearSession() {
  try {
    localStorage.removeItem(HBLITE_SESSION_KEY);
    localStorage.removeItem(LEGACY_SIGNUP_KEY);
  } catch (e) {}
}

function saveRegisteredUser(user) {
  try {
    var raw = localStorage.getItem(HBLITE_USERS_KEY);
    var users = raw ? JSON.parse(raw) : [];
    var idx = users.findIndex(function (u) {
      return u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase();
    });
    if (idx >= 0) {
      users[idx] = Object.assign({}, users[idx], user);
    } else {
      users.push(user);
    }
    localStorage.setItem(HBLITE_USERS_KEY, JSON.stringify(users));
  } catch (e) {}
}

function findRegisteredUser(email) {
  try {
    var raw = localStorage.getItem(HBLITE_USERS_KEY);
    if (!raw) return null;
    var users = JSON.parse(raw);
    return users.find(function (u) {
      return u.email && u.email.toLowerCase() === (email || "").toLowerCase();
    }) || null;
  } catch (e) {
    return null;
  }
}

function signupPageUrl() {
  var path = window.location.pathname || "";
  if (path.indexOf("/") === -1) {
    return "signup.html";
  }
  var dir = path.substring(0, path.lastIndexOf("/") + 1);
  return dir + "signup.html";
}

function homePageUrl() {
  var path = window.location.pathname || "";
  if (path.indexOf("/") === -1) {
    return "index.html";
  }
  var dir = path.substring(0, path.lastIndexOf("/") + 1);
  return dir + "index.html";
}

/** Call from protected pages (in <head>) so content is not shown first. */
function requireSignup() {
  if (!hasSignedUp()) {
    window.location.replace(signupPageUrl());
  }
}

/** Call from signup.html — skip the form if already signed up, unless ?switch=1 or ?mode=login is passed. */
function redirectIfSignedUp() {
  var search = window.location.search || "";
  if (search.indexOf("switch=1") !== -1 || search.indexOf("logout=1") !== -1) {
    if (search.indexOf("logout=1") !== -1) {
      clearSession();
    }
    return;
  }
  if (hasSignedUp()) {
    window.location.replace(homePageUrl());
  }
}
