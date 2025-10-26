# Build & Deployment Guide

## Quick Start: Build Locally in 5 Minutes

### Step 1: Install Dependencies

```bash
cd Lamma-chat/api
npm install
```

This will install:
- `@anthropic-ai/sdk` - Claude API client
- `@azure/functions` - Azure Functions runtime

### Step 2: Configure Your API Key

Edit `api/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "ANTHROPIC_API_KEY": "sk-ant-your-key-here",
    "ALLOWED_ORIGINS": "*"
  },
  "Host": {
    "CORS": "*"
  }
}
```

### Step 3: Run Locally

```bash
# From the api directory
npm start

# Or if you have Azure Functions Core Tools installed
func start
```

Your API will be running at: `http://localhost:7071`

### Step 4: Open the Frontend

Open in your browser:
- **Standard version:** `index.html`
- **ILE Protected version:** `index-ile.html`

Both will automatically connect to `http://localhost:7071` when running locally.

## Testing the ILE System

### Test 1: Normal Operation

1. Open `index-ile.html` in your browser
2. Wait for "ILE System Operational" status
3. Type: "Hello, how are you?"
4. **Expected:** Message passes vetting, response appears with green "VETTED ✓" badge

### Test 2: Hallucination Detection

1. Type: "Do you have access to real-time internet data?"
2. **Expected:**
   - If Claude claims it does, risk score may increase
   - May trigger warning but likely won't quarantine (threshold is 60)

### Test 3: Trigger Quarantine (Intentional)

To test the quarantine system, you can:

**Option A: Lower the threshold temporarily**

Edit `api/ile-init.js`:
```javascript
autoQuarantineThreshold: 10, // Set very low to trigger easily
```

**Option B: Add custom detection rules**

The detector looks for patterns. You could ask something that matches the existing rules.

### Test 4: CEO Approval Workflow

1. Trigger a quarantine (see Test 3)
2. Check the "CEO APPROVALS REQUIRED" panel
3. Click "✓ Approve Replacement"
4. **Expected:**
   - Model replacement sequence starts
   - New partition created
   - Atomic switch performed
   - Canary monitoring begins
   - Status updates in real-time

### Test 5: System Status

1. Keep `index-ile.html` open
2. Watch the "SYSTEM STATUS" panel
3. **Expected:**
   - Active Workers: 1
   - Quarantined: 0 (unless you triggered one)
   - Outputs Vetted: Increases with each message
   - Failure Rate: Updates automatically

## Deploy to Azure

### Prerequisites

1. **Azure Account** - [Sign up free](https://azure.microsoft.com/free/)
2. **Anthropic API Key** - [Get from console](https://console.anthropic.com/)
3. **GitHub Account** - For automated deployment

### Method 1: Azure Portal (Recommended)

#### 1. Create Static Web App

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"** → **"Static Web App"**
3. Configure:
   - **Subscription:** Your subscription
   - **Resource Group:** Create new: `lamma-chat-ile-rg`
   - **Name:** `lamma-chat-ile` (must be unique)
   - **Plan type:** Free (for testing) or Standard (for production)
   - **Region:** Choose closest to your users
   - **Deployment source:** GitHub
   - **Sign in with GitHub** and authorize
   - **Organization:** Your GitHub username
   - **Repository:** `Lamma-chat`
   - **Branch:** `claude/azure-integration-011CUUijgpt3BwcHjxBarQGF`

4. **Build Details:**
   - **Build Presets:** Custom
   - **App location:** `/`
   - **Api location:** `api`
   - **Output location:** (leave empty)

5. Click **"Review + Create"** → **"Create"**

#### 2. Configure Environment Variables

1. Wait for deployment to complete (~2 minutes)
2. Go to your Static Web App in Azure Portal
3. Click **"Configuration"** in the left menu
4. Click **"+ Add"** under Application settings
5. Add these settings:

```
Name: ANTHROPIC_API_KEY
Value: sk-ant-your-actual-key-here

Name: ILE_QUARANTINE_THRESHOLD
Value: 60

Name: ILE_CANARY_DURATION
Value: 1800000

Name: ILE_REQUIRE_CEO_APPROVAL
Value: true

Name: ALLOWED_ORIGINS
Value: * (or your specific domain)
```

6. Click **"Save"**

#### 3. Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:

```
AZURE_STATIC_WEB_APPS_API_TOKEN
  → Get from Azure Portal: Your Static Web App → Overview → Manage deployment token

ANTHROPIC_API_KEY
  → Your Anthropic API key (same as above)
```

#### 4. Deploy

The GitHub Actions workflow will automatically deploy when you push to the branch.

To trigger manually:
1. Go to your repo → **Actions** tab
2. Select the workflow
3. Click **"Run workflow"**

Or push a small change:
```bash
git commit --allow-empty -m "Trigger deployment"
git push origin claude/azure-integration-011CUUijgpt3BwcHjxBarQGF
```

#### 5. Access Your App

1. Go to Azure Portal → Your Static Web App → **Overview**
2. Click the **URL** (e.g., `https://lamma-chat-ile.azurestaticapps.net`)
3. Navigate to `/index-ile.html` for the ILE-protected interface

### Method 2: Azure CLI

```bash
# Install Azure CLI if needed
# https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

# Login
az login

# Create resource group
az group create \
  --name lamma-chat-ile-rg \
  --location eastus

# Create Static Web App
az staticwebapp create \
  --name lamma-chat-ile \
  --resource-group lamma-chat-ile-rg \
  --source https://github.com/YOUR-USERNAME/Lamma-chat \
  --location eastus \
  --branch claude/azure-integration-011CUUijgpt3BwcHjxBarQGF \
  --app-location "/" \
  --api-location "api" \
  --login-with-github

# Set environment variables
az staticwebapp appsettings set \
  --name lamma-chat-ile \
  --resource-group lamma-chat-ile-rg \
  --setting-names \
    ANTHROPIC_API_KEY="sk-ant-your-key" \
    ILE_QUARANTINE_THRESHOLD="60" \
    ILE_CANARY_DURATION="1800000" \
    ILE_REQUIRE_CEO_APPROVAL="true"
```

## Verification Checklist

After deployment, verify:

- [ ] Website loads at Azure URL
- [ ] Navigate to `/index-ile.html`
- [ ] System status shows "ILE System Operational"
- [ ] Can send a message and receive response
- [ ] Message shows "VETTED ✓" badge
- [ ] System stats update (Outputs Vetted counter increases)
- [ ] No errors in browser console (F12)

## Troubleshooting

### Issue: "ILE System Error" status

**Check:**
```bash
# View Azure Functions logs
az webapp log tail \
  --name lamma-chat-ile \
  --resource-group lamma-chat-ile-rg
```

**Common causes:**
- `ANTHROPIC_API_KEY` not set or invalid
- API key has no credits
- Functions runtime error

**Solution:**
1. Verify environment variable in Azure Portal → Configuration
2. Check Anthropic console for API key status
3. Review Function logs for specific error

### Issue: "Failed to process message through ILE system"

**Check:**
- Browser console (F12) for error details
- Network tab shows 500 error from `/api/chat-ile`
- Azure Functions logs for stack trace

**Common causes:**
- ILE system initialization failed
- API key issues
- Dependency missing

**Solution:**
```bash
# Redeploy
git commit --allow-empty -m "Redeploy"
git push
```

### Issue: Outputs always quarantined

**Check:**
- `ILE_QUARANTINE_THRESHOLD` setting
- Hallucination detector sensitivity

**Solution:**
- Increase threshold: `ILE_QUARANTINE_THRESHOLD=80`
- Lower sensitivity: `ILE_SENSITIVITY=LOW`

### Issue: CEO approvals not appearing

**Check:**
- `ILE_REQUIRE_CEO_APPROVAL` is set to `true`
- Risk score actually exceeds threshold
- Frontend polling is working (check Network tab)

**Solution:**
- Verify environment variable
- Lower quarantine threshold to trigger more easily
- Check browser console for polling errors

## Performance Tuning

### For High Traffic

1. **Upgrade to Standard Plan**
   - Azure Portal → Your Static Web App → Settings → Hosting plan
   - Switch from Free to Standard

2. **Increase Function Timeout**
   - Edit `api/host.json`:
   ```json
   {
     "functionTimeout": "00:10:00"
   }
   ```

3. **Add Application Insights**
   - Azure Portal → Your Static Web App → Application Insights
   - Enable monitoring
   - Set up alerts for errors

### For Production

1. **Custom Domain**
   - Azure Portal → Your Static Web App → Custom domains
   - Add your domain
   - Update `ALLOWED_ORIGINS` to match

2. **Authentication**
   - Azure Portal → Your Static Web App → Authentication
   - Add authentication provider (Azure AD, GitHub, etc.)
   - Restrict `/api/approvals` to authenticated users only

3. **Rate Limiting**
   - Implement in `api/chat-ile/index.js`
   - Use Azure API Management for advanced controls

4. **Persistent Storage**
   - Mount Azure Files for `/tmp/ile-snapshots`
   - Mount Azure Files for `/tmp/ile-audit-logs`
   - Ensures snapshots/logs survive restarts

## Monitoring

### Azure Portal

1. **Application Insights**
   - View request rates, response times, failures
   - Set up alerts for high error rates

2. **Function Logs**
   - Real-time streaming: `Log stream` in portal
   - Historical: Application Insights → Logs

3. **Static Web App Metrics**
   - Bandwidth usage
   - Request counts
   - Geographic distribution

### ILE-Specific Monitoring

Use the `/api/ile-status` endpoint:

```bash
curl https://your-app.azurestaticapps.net/api/ile-status
```

Monitor:
- Active workers
- Quarantine count
- Vetting failure rate
- Pending approvals

Set up alerts:
- If quarantine count > 0, send notification
- If failure rate > 10%, investigate
- If pending approvals > 5, escalate to CEO

## Cost Optimization

### Free Tier Limits

**Azure Static Web Apps (Free):**
- 100 GB bandwidth/month
- Unlimited requests
- 2 custom domains
- Free SSL
- **Good for:** Testing, low traffic

**Azure Functions (Consumption):**
- 1M requests/month free
- 400,000 GB-s execution time free
- **Good for:** Most applications

### Expected Costs

**Low traffic** (1,000 messages/day):
- Static Web Apps: Free
- Azure Functions: Free
- Anthropic API: ~$3-10/month
- **Total: $3-10/month**

**Medium traffic** (10,000 messages/day):
- Static Web Apps: $0-5/month
- Azure Functions: $0-5/month
- Anthropic API: ~$30-100/month
- **Total: $30-110/month**

**High traffic** (100,000 messages/day):
- Static Web Apps Standard: ~$10/month
- Azure Functions: ~$20/month
- Anthropic API: ~$300-1000/month
- **Total: $330-1030/month**

## Next Steps

Once deployed and tested:

1. **Customize Detection Rules**
   - Edit `ile-system/ile-co/hallucination-detector.js`
   - Add domain-specific patterns
   - Tune risk scoring

2. **Set Up Monitoring**
   - Application Insights alerts
   - Webhook notifications for quarantines
   - Daily CEO summary emails

3. **Add Authentication**
   - Protect admin endpoints
   - Role-based access (CEO, viewers)

4. **Scale Testing**
   - Load test with multiple concurrent users
   - Verify canary monitoring under load
   - Test quarantine recovery

5. **Documentation**
   - Document your custom rules
   - Create CEO runbook
   - Write incident response procedures

## Support

- **Azure Issues:** [Azure Support](https://azure.microsoft.com/support/)
- **Anthropic API:** [Anthropic Support](https://support.anthropic.com/)
- **ILE System:** Review `ILE-SYSTEM.md` documentation

---

**You're ready to build!** Start with local testing, then deploy to Azure. 🚀
