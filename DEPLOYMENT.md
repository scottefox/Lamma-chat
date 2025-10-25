# Quick Deployment Guide

## 🚀 Deploy to Azure in 5 Minutes

### Prerequisites
- Azure account ([Get free account](https://azure.microsoft.com/free/))
- Anthropic API key ([Get from console](https://console.anthropic.com/))
- GitHub account

### Step 1: Fork & Configure

1. Fork this repository to your GitHub account
2. Go to your repository Settings → Secrets and variables → Actions
3. You'll add secrets in Step 3 after creating the Azure resource

### Step 2: Create Azure Static Web App

#### Option A: Via Azure Portal (Recommended)

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"+ Create a resource"**
3. Search for **"Static Web App"** and click Create
4. Fill in the details:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new (e.g., "lamma-chat-rg")
   - **Name**: Choose a unique name (e.g., "my-claude-chat")
   - **Plan type**: Free
   - **Region**: Choose closest to your users
   - **Deployment source**: GitHub
   - Click **"Sign in with GitHub"** and authorize Azure
   - **Organization**: Your GitHub username
   - **Repository**: Select your forked repository
   - **Branch**: main (or claude/azure-integration-*)

5. **Build Details**:
   - **Build Presets**: Custom
   - **App location**: `/`
   - **Api location**: `api`
   - **Output location**: (leave empty)

6. Click **"Review + Create"** → **"Create"**

7. Wait for deployment (1-2 minutes)

#### Option B: Via Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name lamma-chat-rg --location eastus

# Create static web app
az staticwebapp create \
  --name my-claude-chat \
  --resource-group lamma-chat-rg \
  --source https://github.com/YOUR-USERNAME/Lamma-chat \
  --location eastus \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --login-with-github
```

### Step 3: Configure Secrets & Environment Variables

#### In GitHub (for CI/CD):

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add these secrets:

   **Secret 1:**
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: Get this from Azure Portal → Your Static Web App → Overview → Manage deployment token

   **Secret 2:**
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key from https://console.anthropic.com/

#### In Azure Portal (for Runtime):

1. Go to Azure Portal → Your Static Web App
2. Click **"Configuration"** in the left menu
3. Click **"+ Add"** under Application settings
4. Add:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Your Anthropic API key
5. Click **"OK"** then **"Save"**

### Step 4: Deploy

If you used the Azure Portal in Step 2, Azure automatically created a GitHub Actions workflow.

**Trigger Deployment:**

```bash
# Make any small change and push
git add .
git commit -m "Trigger deployment"
git push origin main
```

**Monitor Deployment:**
- Go to your GitHub repository → **Actions** tab
- Watch the build progress (typically 2-3 minutes)
- Once complete, the workflow will show a ✅ green checkmark

### Step 5: Access Your App

1. Go to Azure Portal → Your Static Web App → Overview
2. Click the **URL** (e.g., https://my-claude-chat.azurestaticapps.net)
3. Start chatting with Claude!

## 🔧 Testing Locally First

If you want to test locally before deploying:

```bash
# Clone your repository
git clone https://github.com/YOUR-USERNAME/Lamma-chat
cd Lamma-chat

# Install dependencies
cd api
npm install
cd ..

# Configure local environment
# Edit api/local.settings.json and add your ANTHROPIC_API_KEY

# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Run locally
swa start . --api-location ./api
```

Open http://localhost:4280

## 📊 Verify Everything Works

1. **Frontend loads**: Open your Azure URL
2. **Status shows connected**: Look for "Connected to Azure - Ready to chat with Claude!"
3. **Send a test message**: Type "Hello" and press Send
4. **Receive response**: You should get a response from Claude within a few seconds

## ❌ Troubleshooting

### Issue: "Backend not available"
**Solution**: Check that the `ANTHROPIC_API_KEY` is set in Azure Portal Configuration

### Issue: "Error: Failed to get response from Claude"
**Solution**:
1. Verify your Anthropic API key is valid
2. Check Azure Functions logs in Portal → Your Static Web App → Functions → Monitor
3. Ensure you have credits in your Anthropic account

### Issue: GitHub Actions workflow failing
**Solution**:
1. Check the Actions tab for error details
2. Verify both GitHub secrets are set correctly
3. Ensure the workflow file is in `.github/workflows/`

### Issue: 404 errors
**Solution**:
1. Verify `index.html` is in the root directory
2. Check `staticwebapp.config.json` is present
3. Redeploy by pushing a new commit

## 🔐 Production Checklist

Before going to production:

- [ ] Update `ALLOWED_ORIGINS` in Azure configuration to your specific domain
- [ ] Enable authentication if needed (Azure Portal → Authentication)
- [ ] Set up custom domain (Azure Portal → Custom domains)
- [ ] Enable Application Insights for monitoring
- [ ] Review Azure Static Web Apps pricing tier
- [ ] Set up rate limiting on the API
- [ ] Review security headers in `staticwebapp.config.json`
- [ ] Test on multiple devices and browsers
- [ ] Set up alerts for Function failures

## 💰 Cost Management

**Free Tier Limits:**
- Static Web Apps: 100 GB bandwidth/month
- Azure Functions: 1M executions/month
- Anthropic API: Pay per use

**Monitor Costs:**
- Azure Portal → Cost Management + Billing
- Anthropic Console → Usage

## 🎉 Next Steps

- Customize the UI in `index.html`
- Add authentication
- Implement conversation persistence
- Add custom domain
- Enable Application Insights
- Set up monitoring and alerts

## 📚 Additional Resources

- [Azure Static Web Apps Documentation](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Functions Documentation](https://learn.microsoft.com/en-us/azure/azure-functions/)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Claude Model Information](https://www.anthropic.com/claude)

---

**Need Help?** Open an issue in this repository or check the main README.md for detailed documentation.
