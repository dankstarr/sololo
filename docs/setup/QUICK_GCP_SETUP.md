# Quick Guide: Get GOOGLE_APPLICATION_CREDENTIALS_JSON

## Step-by-Step Instructions

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. **Sign in** with your Google account
3. **Select or create a project** (top bar, project dropdown)

### Step 2: Create a Service Account
1. Navigate to: **IAM & Admin** → **Service Accounts**
   - Direct link: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click **"+ CREATE SERVICE ACCOUNT"** (top button)
3. Fill in:
   - **Service account name**: `sololo-monitoring` (or any name)
   - **Service account ID**: Auto-filled (you can change it)
   - **Description**: `Service account for Sololo API usage monitoring`
4. Click **"CREATE AND CONTINUE"**

### Step 3: Grant Permissions
1. In **"Grant this service account access to project"**:
   - Click **"Select a role"** dropdown
   - Type: `monitoring viewer`
   - Select: **"Monitoring Viewer"** (`roles/monitoring.viewer`)
   - Click **"ADD ANOTHER ROLE"** (optional, but recommended)
   - Type: `monitoring metric writer` (if you want to write custom metrics)
2. Click **"CONTINUE"**
3. Click **"DONE"** (skip optional "Grant users access" step)

### Step 4: Create and Download JSON Key
1. You should now see your service account in the list
2. **Click on the service account name** (e.g., `sololo-monitoring`)
3. Go to the **"KEYS"** tab (top navigation)
4. Click **"ADD KEY"** → **"Create new key"**
5. Select **"JSON"** format
6. Click **"CREATE"**
7. **A JSON file will automatically download** (e.g., `sololo-monitoring-xxxxx-xxxxx.json`)

### Step 5: Get Your Project ID
1. In Google Cloud Console, look at the **top bar**
2. You'll see your **Project ID** next to the project name
   - Example: `my-project-123456`
   - Or go to: **IAM & Admin** → **Settings** → Copy the **Project ID**

### Step 6: Convert JSON to Environment Variable Format

The downloaded JSON file looks like this (multi-line):
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "sololo-monitoring@your-project-id.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/sololo-monitoring%40your-project-id.iam.gserviceaccount.com"
}
```

**You need to convert it to a single line with escaped quotes:**

#### Option A: Using Command Line (Easiest)
```bash
# Replace with your actual file path
cat ~/Downloads/sololo-monitoring-*.json | tr -d '\n' | sed 's/"/\\"/g'
```

Copy the output and use it as the value for `GOOGLE_APPLICATION_CREDENTIALS_JSON`.

#### Option B: Manual Conversion
1. Open the JSON file in a text editor
2. **Select all** (Cmd+A / Ctrl+A)
3. **Copy** (Cmd+C / Ctrl+C)
4. Paste into a tool that removes line breaks (or manually remove all `\n`)
5. Replace all `"` with `\"` (escape quotes)
6. Result should be one long line starting with `{"type":"service_account",...}`

### Step 7: Set Environment Variables

#### For Local Development (`.env.local`):
```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"sololo-monitoring@your-project-id.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

#### For Vercel (Production):
1. Go to: https://vercel.com/dashboard
2. Select your **Sololo project**
3. **Settings** → **Environment Variables**
4. Add:
   - **Key**: `GOOGLE_CLOUD_PROJECT_ID`
   - **Value**: Your project ID (e.g., `my-project-123456`)
   - **Environments**: Production, Preview, Development
   - Click **"Save"**
5. Add:
   - **Key**: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - **Value**: The single-line JSON string (from Step 6)
   - **Environments**: Production, Preview, Development
   - Click **"Save"**
6. **Redeploy** your project

### Step 8: Enable Cloud Monitoring API
1. Go to: https://console.cloud.google.com/apis/library/monitoring.googleapis.com
2. Click **"ENABLE"** (if not already enabled)

### Step 9: Verify It Works
1. Restart your dev server: `npm run dev`
2. Visit: `http://localhost:3001/admin`
3. Look for **"Google Cloud Platform Usage (Verified)"** section
4. You should see real usage data from GCP! ✅

## Quick Checklist

- [ ] Service account created in Google Cloud Console
- [ ] Service account has `roles/monitoring.viewer` role
- [ ] JSON key downloaded
- [ ] JSON converted to single-line format
- [ ] `GOOGLE_CLOUD_PROJECT_ID` set in `.env.local` or Vercel
- [ ] `GOOGLE_APPLICATION_CREDENTIALS_JSON` set in `.env.local` or Vercel
- [ ] Cloud Monitoring API enabled
- [ ] Dev server restarted
- [ ] Admin dashboard showing GCP usage data

## Troubleshooting

**"GCP credentials not configured"**
- ✅ Check both env vars are set
- ✅ Verify JSON is valid (test with `JSON.parse()`)
- ✅ Ensure JSON is on one line with escaped quotes

**"Failed to fetch GCP usage data"**
- ✅ Cloud Monitoring API enabled?
- ✅ Service account has `roles/monitoring.viewer`?
- ✅ Project ID matches service account's project?

**JSON parsing errors**
- ✅ No line breaks in the JSON string
- ✅ All quotes escaped: `"` → `\"`
- ✅ JSON starts with `{` and ends with `}`

## Security Notes

⚠️ **Important:**
- Never commit the JSON file to git
- Never share the JSON file publicly
- Rotate keys if they're ever exposed
- Use least privilege (only `monitoring.viewer` role)

## Need More Help?

See the full guide: [`docs/setup/GCP_CREDENTIALS_SETUP.md`](./GCP_CREDENTIALS_SETUP.md)
