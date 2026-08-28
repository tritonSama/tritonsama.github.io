/**
 * ============================================================================
 * Seraphim Unbound / HeavenlyBound - Google Apps Script Database Bridge
 * ============================================================================
 * Sheets:
 *   1. BetaTesters -> [timestamp, name, email, guildClass, birthDate, birthTime, phone]
 *   2. Pilgrims    -> [player_id, zodiac_sign, action_type, result, timestamp]
 *   3. Users       -> [GitHubID, Username, CreatedAt, ResourceCredits, BaseLevel, LastSeen]
 *   4. GameStates  -> [GitHubID, SaveDataJSON, LastUpdated, HighScore]
 * 
 * Deployment: Deploy as Web App -> Execute as: Me -> Who has access: Anyone
 * ============================================================================
 */

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Ensure 'BetaTesters' sheet (Matches Image 3 Column Schema)
  var betaSheet = ss.getSheetByName("BetaTesters") || ss.getActiveSheet();
  if (!betaSheet || betaSheet.getLastRow() === 0) {
    if (!betaSheet) betaSheet = ss.insertSheet("BetaTesters");
    betaSheet.appendRow(["timestamp", "name", "email", "guildClass", "birthDate", "birthTime", "phone"]);
    betaSheet.getRange("A1:G1").setFontWeight("bold").setBackground("#0f172a").setFontColor("#60a5fa");
    betaSheet.setFrozenRows(1);
  }

  // 2. Ensure 'Pilgrims' sheet
  var pilgrimsSheet = ss.getSheetByName("Pilgrims");
  if (!pilgrimsSheet) {
    pilgrimsSheet = ss.insertSheet("Pilgrims");
    pilgrimsSheet.appendRow(["player_id", "zodiac_sign", "action_type", "result", "timestamp"]);
    pilgrimsSheet.getRange("A1:E1").setFontWeight("bold").setBackground("#0f172a").setFontColor("#60a5fa");
    pilgrimsSheet.setFrozenRows(1);
  }

  // 3. Ensure 'Users' sheet
  var usersSheet = ss.getSheetByName("Users");
  if (!usersSheet) {
    usersSheet = ss.insertSheet("Users");
    usersSheet.appendRow(["GitHubID", "Username", "CreatedAt", "ResourceCredits", "BaseLevel", "LastSeen"]);
    usersSheet.getRange("A1:F1").setFontWeight("bold").setBackground("#1a1f2c").setFontColor("#ffd700");
    usersSheet.setFrozenRows(1);
  }

  // 4. Ensure 'GameStates' sheet
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
 * Handle GET requests (Health check, Ping, Get Beta Testers, Get Pilgrims)
 */
function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action || "ping";
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    if (action === "ping") {
      return jsonResponse({
        status: "success",
        system: "HeavenlyBound Core API",
        timestamp: new Date().toISOString(),
        message: "Pilgrim Tactical Protocol & Beta Portal Operational."
      });
    }

    if (action === "getBetaTesters") {
      var sheet = ss.getSheetByName("BetaTesters") || ss.getActiveSheet();
      var data = sheet.getDataRange().getValues();
      var testers = [];
      for (var i = 1; i < data.length; i++) {
        testers.push({
          timestamp: data[i][0],
          name: data[i][1],
          email: data[i][2],
          guildClass: data[i][3],
          birthDate: data[i][4],
          birthTime: data[i][5],
          phone: data[i][6]
        });
      }
      return jsonResponse({ status: "success", count: testers.length, testers: testers });
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
 * Handle POST requests (Beta Tester Registration, Pilgrim Sync, State Saves)
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

    var ts = payload.timestamp || new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();

    // Check if this is a Beta Tester Sign-up (name + email or guildClass)
    if (payload.email || payload.name || payload.guildClass || payload.birthDate || payload.action === "beta_signup") {
      var betaSheet = ss.getSheetByName("BetaTesters") || ss.getActiveSheet();
      if (!betaSheet) {
        setupDatabase();
        betaSheet = ss.getSheetByName("BetaTesters") || ss.getActiveSheet();
      }

      // Check header row
      if (betaSheet.getLastRow() === 0) {
        betaSheet.appendRow(["timestamp", "name", "email", "guildClass", "birthDate", "birthTime", "phone"]);
      }

      // Append row matching exact schema: [timestamp, name, email, guildClass, birthDate, birthTime, phone]
      betaSheet.appendRow([
        ts,
        payload.name || payload.fullName || "Operative",
        payload.email || "",
        payload.guildClass || payload.class || payload.archetype || "Tactical Operative",
        payload.birthDate || payload.birthdate || "",
        payload.birthTime || payload.birthtime || "",
        payload.phone || payload.phoneNumber || ""
      ]);

      return jsonResponse({
        result: "success",
        status: "success",
        message: "Beta tester registration recorded successfully.",
        timestamp: ts
      });
    }

    // Default Pilgrim action logging
    var sheet = ss.getSheetByName("Pilgrims");
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName("Pilgrims");
    }

    sheet.appendRow([
      payload.player_id || payload.playerId || "Anonymous",
      payload.zodiac || payload.zodiac_sign || "N/A",
      payload.action || payload.action_type || "tactical_sync",
      payload.card || payload.result || "None",
      new Date().toISOString()
    ]);

    var response = { result: "success", status: "success", shards: 120, timestamp: new Date().toISOString() };
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
  return ContentService.createTextOutput(JSON.stringify({ result: "error", status: "error", error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
