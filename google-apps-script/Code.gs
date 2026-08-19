/**
 * ============================================================================
 * HeavenlyBound - Google Apps Script Database Bridge
 * ============================================================================
 * Sheet Name: HeavenlyBound_GameDB
 * Tables (Worksheets):
 *   1. Users       -> [GitHubID, Username, CreatedAt, ResourceCredits, BaseLevel, LastSeen]
 *   2. GameStates  -> [GitHubID, SaveDataJSON, LastUpdated, HighScore]
 * 
 * Deployment: Deploy as Web App -> Execute as: Me -> Who has access: Anyone
 * ============================================================================
 */

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Ensure 'Users' sheet
  var usersSheet = ss.getSheetByName("Users");
  if (!usersSheet) {
    usersSheet = ss.insertSheet("Users");
    usersSheet.appendRow(["GitHubID", "Username", "CreatedAt", "ResourceCredits", "BaseLevel", "LastSeen"]);
    usersSheet.getRange("A1:F1").setFontWeight("bold").setBackground("#1a1f2c").setFontColor("#ffd700");
    usersSheet.setFrozenRows(1);
  }

  // 2. Ensure 'GameStates' sheet
  var statesSheet = ss.getSheetByName("GameStates");
  if (!statesSheet) {
    statesSheet = ss.insertSheet("GameStates");
    statesSheet.appendRow(["GitHubID", "SaveDataJSON", "LastUpdated", "HighScore"]);
    statesSheet.getRange("A1:D1").setFontWeight("bold").setBackground("#1a1f2c").setFontColor("#00f0ff");
    statesSheet.setFrozenRows(1);
  }

  return "HeavenlyBound Database initialized successfully.";
}

/**
 * Handle GET requests (Health check, Get User Profile, Get Game State, Get Leaderboard)
 */
function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action || "ping";
  var githubId = params.githubId || "";

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    if (action === "ping") {
      return jsonResponse({
        status: "success",
        system: "HeavenlyBound Core API",
        timestamp: new Date().toISOString(),
        message: "Celestial Link Operational."
      });
    }

    if (action === "getUser") {
      if (!githubId) return jsonError("Missing required parameter: githubId");
      var user = findUser(ss, githubId);
      return jsonResponse({ status: "success", user: user });
    }

    if (action === "getGameState") {
      if (!githubId) return jsonError("Missing required parameter: githubId");
      var state = findGameState(ss, githubId);
      return jsonResponse({ status: "success", state: state });
    }

    if (action === "getLeaderboard") {
      var leaderboard = getTopPilgrims(ss, 10);
      return jsonResponse({ status: "success", leaderboard: leaderboard });
    }

    return jsonError("Unknown action: " + action);

  } catch (err) {
    return jsonError(err.toString());
  }
}

/**
 * Handle POST requests (Save User Profile, Save Game State, Sync Shards)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = lock.tryLock(15000);
  if (!hasLock) {
    return jsonError("Database busy, transaction locked. Retry shortly.");
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload = {};

    // Parse JSON body or form parameters
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (pErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action || "syncState";
    var githubId = String(payload.githubId || "").trim();

    if (!githubId) {
      return jsonError("Invalid request: Missing githubId");
    }

    if (action === "syncUser") {
      var username = payload.username || "Unknown Pilgrim";
      var credits = Number(payload.credits || 0);
      var baseLevel = Number(payload.baseLevel || 1);

      var userResult = upsertUser(ss, githubId, username, credits, baseLevel);
      return jsonResponse({ status: "success", action: "syncUser", data: userResult });
    }

    if (action === "syncState") {
      var saveData = payload.saveData || (typeof payload.saveDataJSON === "string" ? payload.saveDataJSON : JSON.stringify(payload.saveDataJSON || {}));
      if (typeof saveData !== "string") {
        saveData = JSON.stringify(saveData);
      }
      var highScore = Number(payload.highScore || 0);

      var stateResult = upsertGameState(ss, githubId, saveData, highScore);
      
      // Also update user credits/base level if present
      if (payload.credits !== undefined || payload.baseLevel !== undefined) {
        upsertUser(ss, githubId, payload.username || "Pilgrim", Number(payload.credits || 0), Number(payload.baseLevel || 1));
      }

      return jsonResponse({ status: "success", action: "syncState", data: stateResult });
    }

    return jsonError("Unsupported POST action: " + action);

  } catch (err) {
    return jsonError("Server error: " + err.toString());
  } finally {
    lock.releaseLock();
  }
}

// ----------------------------------------------------------------------------
// Helper Data Access Functions
// ----------------------------------------------------------------------------

function findUser(ss, githubId) {
  var sheet = ss.getSheetByName("Users");
  if (!sheet) { setupDatabase(); sheet = ss.getSheetByName("Users"); }

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(githubId)) {
      return {
        githubId: data[i][0],
        username: data[i][1],
        createdAt: data[i][2],
        credits: data[i][3],
        baseLevel: data[i][4],
        lastSeen: data[i][5]
      };
    }
  }
  return null;
}

function upsertUser(ss, githubId, username, credits, baseLevel) {
  var sheet = ss.getSheetByName("Users");
  if (!sheet) { setupDatabase(); sheet = ss.getSheetByName("Users"); }

  var data = sheet.getDataRange().getValues();
  var now = new Date().toISOString();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(githubId)) {
      var row = i + 1;
      if (username) sheet.getRange(row, 2).setValue(username);
      if (credits !== undefined && !isNaN(credits)) sheet.getRange(row, 4).setValue(credits);
      if (baseLevel !== undefined && !isNaN(baseLevel)) sheet.getRange(row, 5).setValue(baseLevel);
      sheet.getRange(row, 6).setValue(now);
      return { row: row, status: "updated" };
    }
  }

  // Insert new user
  sheet.appendRow([githubId, username, now, credits || 100, baseLevel || 1, now]);
  return { row: sheet.getLastRow(), status: "created" };
}

function findGameState(ss, githubId) {
  var sheet = ss.getSheetByName("GameStates");
  if (!sheet) { setupDatabase(); sheet = ss.getSheetByName("GameStates"); }

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(githubId)) {
      return {
        githubId: data[i][0],
        saveDataJSON: data[i][1],
        lastUpdated: data[i][2],
        highScore: data[i][3]
      };
    }
  }
  return null;
}

function upsertGameState(ss, githubId, saveDataJSON, highScore) {
  var sheet = ss.getSheetByName("GameStates");
  if (!sheet) { setupDatabase(); sheet = ss.getSheetByName("GameStates"); }

  var data = sheet.getDataRange().getValues();
  var now = new Date().toISOString();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(githubId)) {
      var row = i + 1;
      sheet.getRange(row, 2).setValue(saveDataJSON);
      sheet.getRange(row, 3).setValue(now);
      var currHighScore = Number(data[i][3] || 0);
      if (highScore > currHighScore) {
        sheet.getRange(row, 4).setValue(highScore);
      }
      return { row: row, status: "updated" };
    }
  }

  sheet.appendRow([githubId, saveDataJSON, now, highScore || 0]);
  return { row: sheet.getLastRow(), status: "created" };
}

function getTopPilgrims(ss, limit) {
  var sheet = ss.getSheetByName("GameStates");
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < data.length; i++) {
    list.push({
      githubId: data[i][0],
      highScore: Number(data[i][3] || 0),
      lastUpdated: data[i][2]
    });
  }

  list.sort(function(a, b) { return b.highScore - a.highScore; });
  return list.slice(0, limit || 10);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: "error", error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
