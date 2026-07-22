# Signup → Google Sheets setup

Connect the signup form on this site to a Google Sheet so submissions are saved as rows.

## 1. Create the spreadsheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Name it something like `Operation slipStream Signups`.
3. In row 1, add these headers (exactly one per column):

| A | B | C | D | E |
|---|---|---|---|---|
| Timestamp | Name | Email | Birthdate | BirthTime |

## 2. Add the Apps Script

1. In the sheet: **Extensions → Apps Script**.
2. Delete any sample code and paste this:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date(),
      data.name || "",
      data.email || "",
      data.birthdate || "",
      data.birthtime || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click **Save** (disk icon). Name the project if prompted.

## 3. Deploy as a web app

1. Click **Deploy → New deployment**.
2. Click the gear icon next to **Select type** → choose **Web app**.
3. Settings:
   - **Description:** signup form (optional)
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**.
5. Authorize the app when Google asks (choose your account → Advanced → Go to … → Allow).
6. Copy the **Web app URL** (ends with `/exec`).

## 4. Wire the site

1. Open [`js/signup.js`](js/signup.js).
2. Replace `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with your Web app URL:

```javascript
const SCRIPT_URL = "https://script.google.com/macros/s/XXXX/exec";
```

3. Commit and push so GitHub Pages updates.
4. Open `signup.html` on your live site, submit a test entry, and confirm a new row appears in the sheet.

## Notes

- Until `SCRIPT_URL` is set, the form shows an error asking you to finish setup — and visitors cannot unlock the rest of the site.
- After a successful signup, the browser stores a local flag so that visitor can use Home, Resume, and other pages. Clearing site data requires signing up again.
- If you change the script later, deploy again (**Deploy → Manage deployments → Edit → New version**).
- Signup data stays in your Google account; it is not listed publicly on the site.
