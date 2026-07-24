# FlowCraft — High-Converting Lead Generation Landing Page

A modern, responsive, high-converting lead generation single-page application built to collect leads (Name, Email) directly into **Google Sheets** via **Google Apps Script**, hosted for free on **GitHub Pages**.

![Landing Page Preview](https://img.shields.io/badge/Tech_Stack-HTML5_%7C_CSS3_%7C_Vanilla_JS-0F172A?style=for-the-badge)
![Deployment](https://img.shields.io/badge/Hosting-GitHub_Pages-2EA44F?style=for-the-badge&logo=github)
![Backend](https://img.shields.io/badge/Backend-Google_Apps_Script-4285F4?style=for-the-badge&logo=google)

---

## ✨ Features

- **Zero-Server Architecture**: Uses Google Apps Script as a serverless API endpoint to write leads directly into Google Sheets.
- **High-Converting Hero Section**: Compelling headline, subheadline, dynamic product preview graphic, and social proof counter (5,000+ creators).
- **Benefits Section**: 3 responsive feature cards with icons ("Exclusive Tips", "Free Templates", "Community Access").
- **Interactive Signup Form**:
  - Validates full name (`name="name"`) and email address (`name="email"`).
  - Handles `preventDefault()` and `fetch()` submission.
  - Interactive loading spinner state on the CTA button.
  - Success message notification card upon completion.
  - Error banner display if network or script fails.
- **Modern Aesthetic**: Deep Blue (`#0F172A`) typography, clean whitespace, subtle micro-animations, glassmorphism preview, and Vibrant Orange (`#F97316`) CTA.
- **Mobile-First & Lightweight**: Fast page loads with zero external JS framework dependencies.

---

## 🛠️ Step-by-Step Setup Guide

### 1. Set Up Google Sheet & Google Apps Script

1. **Create a Google Sheet**:
   - Go to [Google Sheets](https://sheets.new) and create a new spreadsheet.
   - Name your sheet (e.g., `FlowCraft Leads`).
   - In **Row 1**, set the following exact column headers in columns A, B, and C:
     - `A1`: `timestamp`
     - `B1`: `name`
     - `C1`: `email`

2. **Open Apps Script Editor**:
   - Click **Extensions** > **Apps Script** in the Google Sheets top menu.
   - Delete any placeholder code in `Code.gs`.

3. **Paste the Backend Script**:
   - Copy and paste the following Google Apps Script code into `Code.gs`:

```javascript
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow() + 1;
    
    var newRow = headers.map(function(header) {
      if (header.toLowerCase() === 'timestamp') return new Date();
      return e.parameter[header] || '';
    });

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

4. **Deploy as a Web App**:
   - Click **Deploy** > **New deployment** (top right).
   - Click the gear icon next to *Select type* and select **Web app**.
   - Fill out the deployment parameters:
     - **Description**: `FlowCraft Lead Collector`
     - **Execute as**: `Me (your email)`
     - **Who has access**: `Anyone` *(Crucial: Allows web form to post leads without requiring user login)*
   - Click **Deploy**.
   - Grant the necessary permissions if prompted by Google.
   - **Copy the Web App URL** (it looks like `https://script.google.com/macros/s/AKfycbx.../exec`).

5. **Connect Web App URL to `index.html`**:
   - Open `index.html`.
   - Locate line ~370 near the bottom in the `<script>` tag:
     ```javascript
     const scriptURL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
     ```
   - Replace `'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'` with your copied Web App URL:
     ```javascript
     const scriptURL = 'https://script.google.com/macros/s/AKfycbx.../exec';
     ```
   - Save `index.html`.

---

### 2. Deploy to GitHub Pages

1. **Commit and Push Changes to GitHub**:
   ```bash
   git add index.html README.md
   git commit -m "Deploy FlowCraft lead generation landing page"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Navigate to your repository on [GitHub](https://github.com).
   - Go to **Settings** > **Pages** (under Code and automation in the left sidebar).
   - Under **Build and deployment**:
     - **Source**: Select `Deploy from a branch`.
     - **Branch**: Select `main` (or `master`) and folder `/ (root)`.
   - Click **Save**.

3. **View Your Live Website**:
   - GitHub Pages will build and deploy your site within 1–2 minutes.
   - Your live site URL will be displayed at the top of the Pages settings tab:
     `https://<your-username>.github.io/<repository-name>/`

---

## 💻 Local Testing & Verification

1. Double-click `index.html` or open it using a local server (e.g., Live Server extension in VS Code or `npx serve .`).
2. Enter a test **Full Name** and **Email Address** into the signup form.
3. Click **Get Instant Access**.
4. Observe the button transition to a loading state (`.spinner`), followed by the animated green success message.
5. Check your Google Sheet — a new row with timestamp, name, and email will instantly appear!

---

## 🎨 Customization

- **Product Name**: Search for `FlowCraft` in `index.html` and replace with your brand or product name.
- **Colors**: Adjust CSS custom properties in `<style>` under `:root`:
  - Primary text/dark accents: `--color-deep-blue` (`#0F172A`)
  - CTA Button: `--color-cta` (`#F97316`)
- **Benefits / Feature Bullet Points**: Modify text inside the `.benefit-card` divs in `index.html`.

---

## 📜 License

MIT License — Free to use, adapt, and deploy for commercial or personal lead generation projects.
