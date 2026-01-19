# Google Cloud Platform Credentials Setup

This guide explains how to set up `GOOGLE_APPLICATION_CREDENTIALS_JSON` to enable GCP API usage monitoring on the admin dashboard (`/admin`).

## What is `GOOGLE_APPLICATION_CREDENTIALS_JSON`?

`GOOGLE_APPLICATION_CREDENTIALS_JSON` is an environment variable that contains your **entire Google Cloud service account JSON file as a single string**. This is useful for:
- **Vercel/Serverless deployments** (where you can't use file paths)
- **Docker containers** (where mounting files is complex)
- **CI/CD pipelines** (where secrets are managed as env vars)

## Step 1: Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click **"Create Service Account"**
5. Fill in:
   - **Name**: `sololo-monitoring` (or any name you prefer)
   - **Description**: "Service account for Sololo API usage monitoring"
6. Click **"Create and Continue"**

## Step 2: Grant Required Permissions

1. In the **"Grant this service account access to project"** section:
   - Add role: **"Monitoring Viewer"** (`roles/monitoring.viewer`)
   - This allows reading API usage metrics
2. Click **"Continue"** → **"Done"**

## Step 3: Create and Download JSON Key

1. Click on your newly created service account
2. Go to the **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Select **"JSON"** format
5. Click **"Create"**
6. A JSON file will download (e.g., `sololo-monitoring-xxxxx.json`)

**⚠️ Important**: Keep this file secure! It contains credentials that can access your GCP project.

## Step 4: Set the Environment Variable

### Option A: Local Development (`.env.local`)

1. Open the downloaded JSON file in a text editor
2. Copy the **entire JSON content** (all of it, including `{` and `}`)
3. Open `.env.local` in your project root
4. Add:

```env
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"sololo-monitoring@your-project-id.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

**Important Notes:**
- The JSON must be on **one line** (no line breaks)
- Escape any quotes inside the JSON with `\"`
- Replace `your-gcp-project-id` with your actual GCP project ID

### Option B: Vercel (Production)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Sololo project**
3. Go to **Settings** → **Environment Variables**
4. Add two variables:

   **Variable 1:**
   - **Key**: `GOOGLE_CLOUD_PROJECT_ID`
   - **Value**: `your-gcp-project-id`
   - **Environment**: Production, Preview, Development
   - Click **"Save"**

   **Variable 2:**
   - **Key**: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - **Value**: Paste the entire JSON (one line, escaped)
   - **Environment**: Production, Preview, Development
   - Click **"Save"**

5. **Redeploy** your project

### Option C: Using a Helper Script (Easier)

Create a file `scripts/set-gcp-credentials.sh`:

```bash
#!/bin/bash
# Helper script to convert service account JSON to env var format

if [ -z "$1" ]; then
  echo "Usage: ./scripts/set-gcp-credentials.sh path/to/service-account.json"
  exit 1
fi

JSON_FILE="$1"
PROJECT_ID=$(cat "$JSON_FILE" | grep -o '"project_id": "[^"]*"' | cut -d'"' -f4)

# Convert JSON to single line, escape quotes
JSON_ONELINE=$(cat "$JSON_FILE" | tr -d '\n' | sed 's/"/\\"/g')

echo ""
echo "Add these to your .env.local or Vercel environment variables:"
echo ""
echo "GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID"
echo "GOOGLE_APPLICATION_CREDENTIALS_JSON=\"$JSON_ONELINE\""
echo ""
```

Make it executable:
```bash
chmod +x scripts/set-gcp-credentials.sh
```

Run it:
```bash
./scripts/set-gcp-credentials.sh ~/Downloads/sololo-monitoring-xxxxx.json
```

Copy the output to your `.env.local` or Vercel.

## Step 5: Enable Cloud Monitoring API

1. Go to [Google Cloud Console - APIs & Services](https://console.cloud.google.com/apis/library)
2. Search for **"Cloud Monitoring API"**
3. Click **"Enable"**

## Step 6: Verify It Works

1. Restart your dev server: `npm run dev`
2. Visit `http://localhost:3001/admin`
3. Look for the **"Google Cloud Platform Usage (Verified)"** section
4. If configured correctly, you should see:
   - ✅ No error messages
   - ✅ Project ID displayed
   - ✅ Real usage data from GCP (requests today, errors, etc.)

## Troubleshooting

### "GCP credentials not configured"
- ✅ Check `GOOGLE_CLOUD_PROJECT_ID` is set
- ✅ Check `GOOGLE_APPLICATION_CREDENTIALS_JSON` is set
- ✅ Verify JSON is valid (no line breaks, properly escaped)
- ✅ Restart dev server after adding env vars

### "Failed to fetch GCP usage data"
- ✅ Ensure Cloud Monitoring API is enabled
- ✅ Verify service account has `roles/monitoring.viewer` role
- ✅ Check project ID matches the service account's project

### JSON parsing errors
- ✅ Ensure JSON is on one line (no `\n`)
- ✅ Escape all quotes: `"` → `\"`
- ✅ Verify JSON is valid: use `JSON.parse()` in Node.js to test

### Alternative: Use File Path (Local Dev Only)

If you prefer using a file path instead of JSON string:

```env
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

**Note**: This only works locally. For Vercel/serverless, use `GOOGLE_APPLICATION_CREDENTIALS_JSON`.

## Security Best Practices

1. **Never commit** service account JSON to git
2. **Rotate keys** if they're ever exposed
3. **Use least privilege**: Only grant `roles/monitoring.viewer` (not admin roles)
4. **Restrict service account** to specific APIs if possible
5. **Monitor usage** in Google Cloud Console

## Next Steps

- ✅ Service account created
- ✅ Permissions granted (`roles/monitoring.viewer`)
- ✅ JSON key downloaded
- ✅ Environment variables set
- ✅ Cloud Monitoring API enabled
- ✅ Admin dashboard showing GCP usage data

For production deployments, see [Vercel Environment Variables Setup](../deployment/VERCEL_ENV_VARIABLES.md).
