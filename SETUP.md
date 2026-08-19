# HeavenlyBound — Step-by-Step Setup Guide

Follow this guide to deploy your **HeavenlyBound** database on Google Sheets and configure GitHub OAuth authentication for your GitHub Pages deployment.

---

## 📑 Phase 1: Google Sheets Database Setup

1. **Create the Google Sheet**:
   - Go to [Google Sheets](https://sheets.new) and create a new spreadsheet.
   - Name the spreadsheet: **`HeavenlyBound_GameDB`**.

2. **Open Google Apps Script Editor**:
   - In Google Sheets, click **Extensions > Apps Script** in the top navigation bar.

3. **Paste Backend Script (`Code.gs`)**:
   - Delete any placeholder code in the script editor.
   - Copy and paste the complete contents of [`google-apps-script/Code.gs`](google-apps-script/Code.gs) into `Code.gs`.

4. **Initialize Database Tables**:
   - In the Apps Script toolbar, select the `setupDatabase` function from the dropdown menu and click **Run**.
   - Review and grant permissions when prompted.
   - Verify that two worksheets are created in your Google Sheet:
     - `Users`: `GitHubID`, `Username`, `CreatedAt`, `ResourceCredits`, `BaseLevel`, `LastSeen`
     - `GameStates`: `GitHubID`, `SaveDataJSON`, `LastUpdated`, `HighScore`

5. **Deploy as Web App**:
   - Click **Deploy > New deployment** (top-right).
   - Click the gear icon next to *Select type* and choose **Web app**.
   - Configure the deployment settings:
     - **Description**: `HeavenlyBound Production API`
     - **Execute as**: `Me (your_email@gmail.com)`
     - **Who has access**: `Anyone` *(Required for client-side REST calls)*
   - Click **Deploy**.
   - Copy the generated **Web app URL** (e.g. `https://script.google.com/macros/s/.../exec`).

---

## 🔑 Phase 2: GitHub OAuth App Registration

1. **Create OAuth Application**:
   - Go to **GitHub Settings > Developer settings > OAuth Apps > New OAuth App**.
   - Fill in the application details:
     - **Application name**: `HeavenlyBound`
     - **Homepage URL**: `https://<your-username>.github.io/<repository-name>/`
     - **Authorization callback URL**: `https://<your-username>.github.io/<repository-name>/index.html`
   - Click **Register application**.

2. **Copy Credentials**:
   - Copy the **Client ID**.

---

## 🌐 Phase 3: Connect Frontend to Backend

1. Open your live GitHub Pages URL or open `index.html` locally in your browser.
2. Click **⚙️ SYSTEM CONFIG** in the top navigation header.
3. Paste:
   - **GitHub OAuth Client ID** into the Client ID field.
   - **Google Apps Script Web App URL** into the Apps Script URL field.
4. Click **⚡ Ping Endpoint** to verify the connection.
5. Click **Save Config**.

---

## 🕹️ Phase 4: Verification & Gameplay Testing

1. **Guest / Pilgrim Launch**: Click **⚡ Instant Pilgrim Guest Launch** to immediately jump in with local persistence.
2. **Outie Sanctum Base Loop**:
   - Construct a *Sol Foundry* and *Aether Well* on the canvas grid.
   - Watch real-time Tithe Credit and Aether Shard generation.
3. **Innie Ascent Incursion Loop**:
   - Click **🚀 INITIATE ASCENT RUN**.
   - Traverse adjacent nodes on the $5 \times 5$ map.
   - Roll $d20 + \text{Mod}$ to overcome Corrupted Seraphs and decrypt Scripture Terminals.
   - Monitor the **Grace Stability** meter as memory degrades over time.
   - Reach the **Ascent Extraction Gate** and click **💎 SECURE & EXTRACT TO SANCTUM** to bank your findings.
4. **Verify Google Sheets Persistence**:
   - Open your `HeavenlyBound_GameDB` spreadsheet.
   - Check that rows in `Users` and `GameStates` are populated with your player profile and JSON state.
