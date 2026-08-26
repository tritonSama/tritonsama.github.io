/**
 * ============================================================================
 * Seraphim Unbound / HeavenlyBound - Google Apps Script Database Bridge
 * ============================================================================
 * Sheets:
 *   1. Pilgrims    -> [player_id, zodiac_sign, action_type, result, timestamp]
 *   2. Users       -> [GitHubID, Username, CreatedAt, ResourceCredits, BaseLevel, LastSeen]
 *   3. GameStates  -> [GitHubID, SaveDataJSON, LastUpdated, HighScore]
 * 
 * Deployment: Deploy as Web App -> Execute as: Me -> Who has access: Anyone
 * ============================================================================
 */

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Ensure 'Pilgrims' sheet
  var pilgrimsSheet = ss.getSheetByName("Pilgrims");
  if (!pilgrimsSheet) {
    pilgrimsSheet = ss.insertSheet("Pilgrims");
    pilgrimsSheet.appendRow(["player_id", "zodiac_sign", "action_type", "result", "timestamp"]);
    pilgrimsSheet.getRange("A1:E1").setFontWeight("bold").setBackground("#0f172a").setFontColor("#60a5fa");
    pilgrimsSheet.setFrozenRows(1);
  }

  // 2. Ensure 'Users' sheet
  var usersSheet = ss.getSheetByName("Users");
  if (!usersSheet) {
    usersSheet = ss.insertSheet("Users");
    usersSheet.appendRow(["GitHubID", "Username", "CreatedAt", "ResourceCredits", "BaseLevel", "LastSeen"]);
    usersSheet.getRange("A1:F1").setFontWeight("bold").setBackground("#1a1f2c").setFontColor("#ffd700");
    usersSheet.setFrozenRows(1);
  }

  // 3. Ensure 'GameStates' sheet
  var statesSheet = ss.getSheetByName("GameStates");
  if (!statesSheet) {
    statesSheet = ss.insertSheet("GameStates");
    statesSheet.appendRow(["GitHubID", "SaveDataJSON", "LastUpdated", "HighScore"]);
    statesSheet.getRange("A1:D1").setFontWeight("bold").setBackground("#1a1f2c").setFontColor("#00f0ff");
    statesSheet.setFrozenRows(1);
  }

  return "Database initialized successfully.";
}

/**
 * Handle GET requests (Health check, Ping, Get Pilgrims, etc.)
 */
function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action || "ping";
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    if (action === "ping") {
      return jsonResponse({
        status: "success",
        system: "Seraphim Unbound Core API",
        timestamp: new Date().toISOString(),
        message: "Pilgrim Tactical Protocol Operational."
      });
    }

    if (action === "getPilgrims") {
      var sheet = ss.getSheetByName("Pilgrims");
      if (!sheet) { setupDatabase(); sheet = ss.getSheetByName("Pilgrims"); }
      var data = sheet.getDataRange().getValues();
      var pilgrims = [];
      for (var i = 1; i < data.length; i++) {
        pilgrims.push({
          playerId: data[i][0],
          zodiac: data[i][1],
          action: data[i][2],
          result: data[i][3],
          timestamp: data[i][4]
        });
      }
      return jsonResponse({ status: "success", pilgrims: pilgrims });
    }

    return jsonResponse({ status: "success", message: "API active." });
  } catch (err) {
    return jsonError(err.toString());
  }
}

/**
 * Handle POST requests (Pilgrim Sync, Vault Breach, State Saves)
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

    var sheet = ss.getSheetByName("Pilgrims");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("Pilgrims");
    }

    // Append to Pilgrims Table
    sheet.appendRow([
      payload.player_id || payload.playerId || "Anonymous",
      payload.zodiac || payload.zodiac_sign || "N/A",
      payload.action || payload.action_type || "tactical_sync",
      payload.card || payload.result || "None",
      new Date().toISOString()
    ]);

    var response = { status: "success", shards: 120, timestamp: new Date().toISOString() };
    return jsonResponse(response);

  } catch (err) {
    return jsonError("Server error: " + err.toString());
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: "error", error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
