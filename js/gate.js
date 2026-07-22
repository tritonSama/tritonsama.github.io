/** Client-side signup gate for static GitHub Pages. */
var SLIPSTREAM_SIGNUP_KEY = "slipstream_signed_up";

function hasSignedUp() {
  try {
    return localStorage.getItem(SLIPSTREAM_SIGNUP_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function markSignedUp() {
  localStorage.setItem(SLIPSTREAM_SIGNUP_KEY, "1");
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

/** Call from signup.html — skip the form if already signed up. */
function redirectIfSignedUp() {
  if (hasSignedUp()) {
    window.location.replace(homePageUrl());
  }
}
