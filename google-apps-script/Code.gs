/**
 * ============================================================================
 * Seraphim Unbound / HeavenlyBound - Google Apps Script Database Bridge
 * ============================================================================
 * Sheets:
 *   1. BetaTesters -> [timestamp, name, email, guildClass, birthDate, phone]
 *   2. Pilgrims    -> [player_id, zodiac_sign, action_type, result, timestamp]
 *   3. Users       -> [GitHubID, Username, CreatedAt, ResourceCredits, BaseLevel, LastSeen]
 *   4. GameStates  -> [GitHubID, SaveDataJSON, LastUpdated, HighScore]
 * 
 * Deployment: Deploy as Web App -> Execute as: Me -> Who has access: Anyone
 * ============================================================================
 */

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Ensure 'Leaderboard' sheet (Matches SEVERANCE v2.4 Schema)
  var lbSheet = ss.getSheetByName("Leaderboard");
  if (!lbSheet) {
    lbSheet = ss.insertSheet("Leaderboard");
    lbSheet.appendRow(["OperativeID", "OperativeName", "BankedShards", "TitheRating", "LastActive"]);
    lbSheet.getRange("A1:E1").setFontWeight("bold").setBackground("#07090e").setFontColor("#00f0ff");
    lbSheet.setFrozenRows(1);
  }

  // 2. Ensure 'AuditLogs' sheet
  var auditSheet = ss.getSheetByName("AuditLogs");
  if (!auditSheet) {
    auditSheet = ss.insertSheet("AuditLogs");
    auditSheet.appendRow(["Timestamp", "OperativeID", "Action", "Payload"]);
    auditSheet.getRange("A1:D1").setFontWeight("bold").setBackground("#07090e").setFontColor("#ff0055");
    auditSheet.setFrozenRows(1);
  }

  // 3. Ensure 'BetaTesters' sheet
  var betaSheet = ss.getSheetByName("BetaTesters") || ss.getActiveSheet();
  if (!betaSheet || betaSheet.getLastRow() === 0) {
    if (!betaSheet) betaSheet = ss.insertSheet("BetaTesters");
    betaSheet.appendRow(["timestamp", "name", "email", "guildClass", "birthDate", "birthTime", "phone"]);
    betaSheet.getRange("A1:G1").setFontWeight("bold").setBackground("#0f172a").setFontColor("#60a5fa");
    betaSheet.setFrozenRows(1);
  }

  // 4. Ensure 'ActiveRooms' sheet
  var roomsSheet = ss.getSheetByName("ActiveRooms");
  if (!roomsSheet) {
    roomsSheet = ss.insertSheet("ActiveRooms");
    roomsSheet.appendRow(["RoomID", "HostName", "Archetype", "Status", "Player1", "Player2", "UpdatedAt"]);
    roomsSheet.getRange("A1:G1").setFontWeight("bold").setBackground("#0f172a").setFontColor("#38bdf8");
    roomsSheet.setFrozenRows(1);
  }

  // 5. Ensure 'Characters' sheet (Look & Fight Cloud Vault)
  var charSheet = ss.getSheetByName("Characters");
  if (!charSheet) {
    charSheet = ss.insertSheet("Characters");
    charSheet.appendRow(["OperativeID", "Name", "GuildClass", "CombatPower", "LookParametersJSON", "FightParametersJSON", "LastSynced", "FullProfileJSON"]);
    charSheet.getRange("A1:H1").setFontWeight("bold").setBackground("#0f172a").setFontColor("#38bdf8");
    charSheet.setFrozenRows(1);
  }

  return "Database initialized successfully.";
}

/**
 * Handle GET requests (Health check, Ping, Get Leaderboard, Get Beta Testers, Get Open Rooms, Get Character Profile)
 */
function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action || "ping";
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    if (action === "ping") {
      return jsonResponse({
        status: "success",
        system: "🕊️ HEAVENLYBOUND: Operation: Severed Grid Tactical Core (Protocol: SEVERANCE v2.4)",
        timestamp: new Date().toISOString(),
        message: "Dual-Consciousness Outie Sanctum / Innie Ascent Core Operational."
      });
    }

    if (action === "get_character" || action === "getCharacterProfile") {
      var charSheet = ss.getSheetByName("Characters");
      if (!charSheet) {
        return jsonResponse({ status: "error", message: "Characters sheet not found in cloud." });
      }
      var targetId = params.operativeId || "tritonSama";
      var data = charSheet.getDataRange().getValues();
      for (var row = 1; row < data.length; row++) {
        if (data[row][0] == targetId) {
          var fullProfile = {};
          try {
            fullProfile = JSON.parse(data[row][7]);
          } catch(e) {
            fullProfile = {
              operativeId: data[row][0],
              name: data[row][1],
              guildClass: data[row][2],
              combatPower: data[row][3],
              look: JSON.parse(data[row][4] || "{}"),
              fight: JSON.parse(data[row][5] || "{}"),
              lastSynced: data[row][6]
            };
          }
          return jsonResponse({
            status: "success",
            result: "success",
            operativeId: data[row][0],
            name: data[row][1],
            guildClass: data[row][2],
            combatPower: data[row][3],
            look: JSON.parse(data[row][4] || "{}"),
            fight: JSON.parse(data[row][5] || "{}"),
            lastSynced: data[row][6],
            profile: fullProfile
          });
        }
      }
      return jsonResponse({ status: "not_found", message: "Operative profile not found in cloud." });
    }

    if (action === "list_characters") {
      var charSheet = ss.getSheetByName("Characters");
      if (!charSheet) return jsonResponse({ status: "success", count: 0, characters: [] });
      var data = charSheet.getDataRange().getValues();
      var chars = [];
      for (var row = 1; row < data.length; row++) {
        if (data[row][0]) {
          chars.push({
            operativeId: data[row][0],
            name: data[row][1],
            guildClass: data[row][2],
            combatPower: data[row][3],
            lastSynced: data[row][6]
          });
        }
      }
      return jsonResponse({ status: "success", count: chars.length, characters: chars });
    }

    if (action === "getLeaderboard") {
      var sheet = ss.getSheetByName("Leaderboard");
      if (!sheet) { setupDatabase(); sheet = ss.getSheetByName("Leaderboard"); }
      var data = sheet.getDataRange().getValues();
      var leaderboard = [];
      for (var i = 1; i < data.length; i++) {
        if (data[i][0]) {
          leaderboard.push({
            operativeId: data[i][0],
            name: data[i][1] || data[i][0],
            bankedShards: Number(data[i][2]) || 0,
            titheRating: Number(data[i][3]) || 0,
            lastActive: data[i][4] || ""
          });
        }
      }
      // Sort descending by Banked Shards
      leaderboard.sort(function(a, b) { return b.bankedShards - a.bankedShards; });
      return jsonResponse({ status: "success", count: leaderboard.length, leaderboard: leaderboard });
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
          birthTime: data[i][5] || "",
          phone: data[i][6] || ""
        });
      }
      return jsonResponse({ status: "success", count: testers.length, testers: testers });
    }

    if (action === "getOpenRooms") {
      var roomsSheet = ss.getSheetByName("ActiveRooms");
      if (!roomsSheet) { setupDatabase(); roomsSheet = ss.getSheetByName("ActiveRooms"); }
      var data = roomsSheet.getDataRange().getValues();
      var openRooms = [];
      var now = Date.now();
      for (var i = 1; i < data.length; i++) {
        var rId = data[i][0];
        var host = data[i][1];
        var archetype = data[i][2];
        var status = data[i][3];
        var p1 = data[i][4];
        var p2 = data[i][5];
        var updated = data[i][6];
        if (status === "waiting" && (!p2 || p2 === "")) {
          openRooms.push({
            id: rId,
            hostName: host,
            archetype: archetype,
            status: "waiting",
            players: [p1],
            maxPlayers: 2,
            updatedAt: updated
          });
        }
      }
      return jsonResponse({ status: "success", count: openRooms.length, rooms: openRooms });
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
 * Handle POST requests (Beta Tester Registration, Pilgrim Sync, State Saves, Room Locking)
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

    // 1. Bank Extraction Action (Dual-Consciousness Shard Extraction)
    if (payload.action === "bankExtraction" || payload.action === "bank_extraction") {
      var lbSheet = ss.getSheetByName("Leaderboard");
      if (!lbSheet) { setupDatabase(); lbSheet = ss.getSheetByName("Leaderboard"); }
      var opId = payload.operativeId || payload.playerId || "ALPHA-PILGRIM";
      var opName = payload.operativeName || payload.name || opId;
      var shardsToAdd = Number(payload.shards) || 0;
      var data = lbSheet.getDataRange().getValues();
      var found = false;
      var newTotal = shardsToAdd;
      var newRating = Math.floor(newTotal * 12.5 + (payload.titheCredits || 0));

      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === opId) {
          newTotal = (Number(data[i][2]) || 0) + shardsToAdd;
          newRating = Math.floor(newTotal * 12.5 + (payload.titheCredits || 0));
          lbSheet.getRange(i + 1, 3, 1, 3).setValues([[newTotal, newRating, ts]]);
          found = true;
          break;
        }
      }
      if (!found) {
        lbSheet.appendRow([opId, opName, newTotal, newRating, ts]);
      }

      // Record in AuditLogs
      var auditSheet = ss.getSheetByName("AuditLogs");
      if (auditSheet) {
        auditSheet.appendRow([ts, opId, "BANK_SHARDS", JSON.stringify({ added: shardsToAdd, total: newTotal, rating: newRating })]);
      }

      return jsonResponse({
        result: "success",
        status: "success",
        bankedShards: newTotal,
        titheRating: newRating,
        message: "Extraction banked successfully to Sanctum."
      });
    }

    // 2. Audit Log Action
    if (payload.action === "auditLog" || payload.action === "audit_log") {
      var aSheet = ss.getSheetByName("AuditLogs");
      if (!aSheet) { setupDatabase(); aSheet = ss.getSheetByName("AuditLogs"); }
      aSheet.appendRow([ts, payload.operativeId || "ALPHA", payload.logAction || "GENERIC", JSON.stringify(payload.payload || {})]);
      return jsonResponse({ result: "success", status: "success" });
    }

    // 3. Character Profile Cloud Save (Look & Fight Parameters)
    if (payload.action === "save_character" || payload.action === "saveCharacterProfile") {
      var charSheet = ss.getSheetByName("Characters");
      var defaultHeaders = ["OperativeID", "Name", "GuildClass", "CombatPower", "LookParametersJSON", "FightParametersJSON", "LastSynced", "FullProfileJSON"];
      if (!charSheet) {
        charSheet = ss.insertSheet("Characters");
        charSheet.appendRow(defaultHeaders);
        charSheet.getRange("A1:H1").setFontWeight("bold").setBackground("#0f172a").setFontColor("#38bdf8");
        charSheet.setFrozenRows(1);
      }
      var opId = payload.operativeId || payload.id || "tritonSama";
      var opName = payload.name || "tritonSama";
      var guildClass = payload.guildClass || (payload.fight && payload.fight.guildClass) || "Abyssal Vanguard (WATER)";
      var combatPower = Number(payload.combatPower || (payload.fight && payload.fight.stats && payload.fight.stats.combatPower) || 53310);
      var lookJson = JSON.stringify(payload.look || payload.lookParameters || {});
      var fightJson = JSON.stringify(payload.fight || payload.fightParameters || {});
      var fullJson = JSON.stringify(payload);

      var data = charSheet.getDataRange().getValues();
      var foundIndex = -1;
      for (var row = 1; row < data.length; row++) {
        if (data[row][0] == opId) {
          foundIndex = row + 1;
          break;
        }
      }

      var rowValues = [opId, opName, guildClass, combatPower, lookJson, fightJson, ts, fullJson];
      if (foundIndex > 0) {
        charSheet.getRange(foundIndex, 1, 1, 8).setValues([rowValues]);
      } else {
        charSheet.appendRow(rowValues);
      }

      return jsonResponse({
        result: "success",
        status: "success",
        operativeId: opId,
        message: "Character Look & Fight parameters saved to cloud vault.",
        timestamp: ts
      });
    }

    // Matchmaking Room Actions (Atomic Registration & Capacity Locking)
    if (payload.action === "register_room") {
      var rSheet = ss.getSheetByName("ActiveRooms");
      if (!rSheet) {
        rSheet = ss.insertSheet("ActiveRooms");
        rSheet.appendRow(["RoomID", "HostName", "Archetype", "Status", "Player1", "Player2", "UpdatedAt"]);
      }
      var rData = rSheet.getDataRange().getValues();
      var found = false;
      for (var r = 1; r < rData.length; r++) {
        if (rData[r][0] === payload.roomId) {
          rSheet.getRange(r + 1, 2, 1, 6).setValues([[
            payload.hostName || "Operative Alpha",
            payload.archetype || "ABYSSAL_TIDE",
            payload.status || "waiting",
            payload.player1 || "P1",
            payload.player2 || "",
            Date.now()
          ]]);
          found = true;
          break;
        }
      }
      if (!found) {
        rSheet.appendRow([
          payload.roomId,
          payload.hostName || "Operative Alpha",
          payload.archetype || "ABYSSAL_TIDE",
          payload.status || "waiting",
          payload.player1 || "P1",
          payload.player2 || "",
          Date.now()
        ]);
      }
      return jsonResponse({ result: "success", status: "success", roomId: payload.roomId });
    }

    if (payload.action === "join_room") {
      var rSheet = ss.getSheetByName("ActiveRooms");
      if (!rSheet) return jsonError("No active rooms sheet found.");
      var rData = rSheet.getDataRange().getValues();
      for (var r = 1; r < rData.length; r++) {
        if (rData[r][0] === payload.roomId) {
          var currentStatus = rData[r][3];
          var currentP2 = rData[r][5];
          // Atomic Server Check: Reject if already locked/full
          if (currentStatus !== "waiting" || (currentP2 && currentP2 !== "")) {
            return jsonError("Room is full (2/2 players). Match already in progress.");
          }
          // Lock slot atomically
          rSheet.getRange(r + 1, 4, 1, 4).setValues([["in_progress", rData[r][4], payload.player2Id || "P2", Date.now()]]);
          return jsonResponse({ result: "success", status: "success", roomId: payload.roomId, seat: "P2" });
        }
      }
      return jsonError("Room not found.");
    }

    if (payload.action === "close_room") {
      var rSheet = ss.getSheetByName("ActiveRooms");
      if (rSheet) {
        var rData = rSheet.getDataRange().getValues();
        for (var r = 1; r < rData.length; r++) {
          if (rData[r][0] === payload.roomId) {
            rSheet.getRange(r + 1, 4).setValue("completed");
            break;
          }
        }
      }
      return jsonResponse({ result: "success", status: "success" });
    }

    // Check if this is a Beta Tester Sign-up (name + email or guildClass or explicit action)
    if (payload.email || payload.name || payload.guildClass || payload.birthDate || payload.birthdate || payload.action === "beta_signup") {
      var betaSheet = ss.getSheetByName("BetaTesters") || ss.getActiveSheet();
      if (!betaSheet) {
        setupDatabase();
        betaSheet = ss.getSheetByName("BetaTesters") || ss.getActiveSheet();
      }

      // Read existing headers from Row 1
      var lastCol = Math.max(betaSheet.getLastColumn(), 1);
      var headerRange = betaSheet.getRange(1, 1, 1, lastCol);
      var headers = headerRange.getValues()[0];

      // If empty sheet or missing headers, initialize canonical 7 columns
      if (betaSheet.getLastRow() === 0 || !headers[0] || headers[0] === "") {
        var defaultHeaders = ["timestamp", "name", "email", "guildClass", "birthDate", "birthTime", "phone"];
        betaSheet.clear();
        betaSheet.appendRow(defaultHeaders);
        betaSheet.getRange("A1:G1").setFontWeight("bold").setBackground("#0f172a").setFontColor("#60a5fa");
        betaSheet.setFrozenRows(1);
        headers = defaultHeaders;
      }

      // Dynamic header mapping: place each field in the exact matching column
      var rowData = [];
      for (var col = 0; col < headers.length; col++) {
        var colName = String(headers[col] || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (colName.indexOf("birth") !== -1 && (colName.indexOf("time") !== -1 || colName.indexOf("tob") !== -1)) {
          // birthTime column
          rowData.push(payload.birthTime || payload.birthtime || "12:00");
        } else if (colName.indexOf("birth") !== -1 || colName.indexOf("dob") !== -1) {
          // birthDate column
          rowData.push(payload.birthDate || payload.birthdate || "");
        } else if (colName.indexOf("guild") !== -1 || colName === "class" || colName === "archetype") {
          // guildClass column
          rowData.push(payload.guildClass || payload.class || payload.archetype || "Tactical Operative");
        } else if (colName.indexOf("phone") !== -1 || colName.indexOf("tel") !== -1 || colName.indexOf("mobile") !== -1) {
          // phone column
          rowData.push(payload.phone || payload.phoneNumber || "");
        } else if (colName.indexOf("mail") !== -1) {
          // email column
          rowData.push(payload.email || "");
        } else if (colName.indexOf("name") !== -1 || colName.indexOf("operative") !== -1 || colName.indexOf("callsign") !== -1) {
          // name column
          rowData.push(payload.name || payload.fullName || payload.callsign || "Operative");
        } else if (colName.indexOf("time") !== -1 || colName.indexOf("date") !== -1) {
          // timestamp column
          rowData.push(ts);
        } else {
          // fallback to direct key lookup or blank
          rowData.push(payload[headers[col]] || "");
        }
      }

      betaSheet.appendRow(rowData);

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
