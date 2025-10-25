# Claude Chat - Azure Edition

A modern chat application powered by Anthropic's Claude AI, deployed on Azure Static Web Apps with Azure Functions backend.

## Overview

This application provides a clean, responsive web interface for chatting with Claude AI. It uses Azure Functions as a serverless backend to handle API calls to Anthropic's Claude API, and is deployed as an Azure Static Web App for global distribution and high availability.

## Features

- **Claude AI Integration**: Powered by Claude 3.5 Sonnet, Anthropic's most advanced AI model
- **Serverless Architecture**: Azure Functions backend for scalable, cost-effective API handling
- **Modern UI**: Responsive, beautiful interface with smooth animations
- **Conversation History**: Maintains context across multiple messages
- **Azure Hosting**: Deployed on Azure Static Web Apps with automatic HTTPS
- **CORS Support**: Properly configured for secure cross-origin requests
- **Error Handling**: Graceful error handling with user-friendly messages

## Architecture

```
┌─────────────────────────────────────────────────┐
│          Azure Static Web Apps                  │
│                                                 │
│  ┌──────────────┐         ┌─────────────────┐ │
│  │   Frontend   │────────▶│ Azure Functions │ │
│  │  (index.html)│         │   (Node.js)     │ │
│  └──────────────┘         └─────────────────┘ │
│                                    │           │
└────────────────────────────────────┼───────────┘
                                     │
                                     ▼
                          ┌──────────────────┐
                          │  Anthropic API   │
                          │  (Claude 3.5)    │
                          └──────────────────┘
```

## Prerequisites

Before you begin, ensure you have:

- An [Azure account](https://azure.microsoft.com/free/)
- An [Anthropic API key](https://console.anthropic.com/)
- [Azure Static Web Apps CLI](https://azure.github.io/static-web-apps-cli/) (for local development)
- [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) (for local development)
- [Node.js](https://nodejs.org/) v18 or later

## Local Development

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Lamma-chat
```

### 2. Install Dependencies

```bash
cd api
npm install
```

### 3. Configure Environment Variables

Create a `local.settings.json` file in the `api` directory:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "ANTHROPIC_API_KEY": "your-actual-api-key-here",
    "ALLOWED_ORIGINS": "*"
  },
  "Host": {
    "CORS": "*"
  }
}
```

Replace `your-actual-api-key-here` with your actual Anthropic API key.

### 4. Run Locally

You have two options for local development:

#### Option A: Using Azure Static Web Apps CLI (Recommended)

```bash
# Install SWA CLI globally (if not already installed)
npm install -g @azure/static-web-apps-cli

# Run from the project root
swa start . --api-location ./api
```

Then open http://localhost:4280 in your browser.

#### Option B: Run Frontend and Backend Separately

Terminal 1 (Backend):
```bash
cd api
npm start
```

Terminal 2 (Frontend):
```bash
# Serve the root directory with any static file server
# For example, using Python:
python3 -m http.server 8000

# Or using npx:
npx serve .
```

Then open the frontend URL and ensure it points to `http://localhost:7071/api/chat`.

## Azure Deployment

### Method 1: Deploy via Azure Portal (Easiest)

1. **Create a Static Web App**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Click "Create a resource" → "Static Web App"
   - Fill in the details:
     - **Name**: Choose a unique name
     - **Region**: Select closest to your users
     - **Deployment source**: GitHub
     - **Organization**: Your GitHub username/org
     - **Repository**: This repository
     - **Branch**: `main` or your preferred branch
     - **Build presets**: Custom
     - **App location**: `/`
     - **Api location**: `api`
     - **Output location**: (leave empty)

2. **Configure Secrets**:
   - Go to your GitHub repository settings
   - Navigate to "Secrets and variables" → "Actions"
   - Add the following secrets:
     - `AZURE_STATIC_WEB_APPS_API_TOKEN`: (automatically created by Azure)
     - `ANTHROPIC_API_KEY`: Your Anthropic API key

3. **Configure Environment Variables in Azure**:
   - In Azure Portal, go to your Static Web App
   - Navigate to "Configuration"
   - Add application setting:
     - `ANTHROPIC_API_KEY`: Your Anthropic API key
     - `ALLOWED_ORIGINS`: Your domain or `*` for development

4. **Deploy**:
   - Push to your configured branch
   - GitHub Actions will automatically deploy your app
   - Check the "Actions" tab in GitHub to monitor progress

### Method 2: Deploy via Azure CLI

```bash
# Install Azure CLI if not already installed
# https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

# Login to Azure
az login

# Create a resource group
az group create --name lamma-chat-rg --location eastus

# Create a Static Web App
az staticwebapp create \
  --name lamma-chat \
  --resource-group lamma-chat-rg \
  --source https://github.com/YOUR-USERNAME/YOUR-REPO \
  --location eastus \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --login-with-github

# Set environment variable
az staticwebapp appsettings set \
  --name lamma-chat \
  --resource-group lamma-chat-rg \
  --setting-names ANTHROPIC_API_KEY="your-api-key-here"
```

### Method 3: Manual GitHub Actions

The repository includes a GitHub Actions workflow at `.github/workflows/azure-static-web-apps.yml`.

To use it:

1. Fork this repository
2. In your GitHub repository, go to Settings → Secrets and variables → Actions
3. Add the required secrets (see Method 1, step 2)
4. Push to the `main` branch or create a pull request
5. GitHub Actions will automatically build and deploy

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Yes | - |
| `ALLOWED_ORIGINS` | CORS allowed origins | No | `*` |

### Azure Functions Configuration

The `api/host.json` file contains Azure Functions runtime configuration:
- Logging settings
- Application Insights integration
- Extension bundle version

### Static Web App Configuration

The `staticwebapp.config.json` file contains:
- Routing rules
- Security headers
- MIME types
- Navigation fallback rules

## API Endpoints

### POST `/api/chat`

Send a message to Claude and get a response.

**Request Body**:
```json
{
  "message": "Hello, Claude!",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ]
}
```

**Response**:
```json
{
  "response": "Hello! How can I help you today?",
  "model": "claude-3-5-sonnet-20241022",
  "usage": {
    "input_tokens": 10,
    "output_tokens": 20
  }
}
```

## Troubleshooting

### Local Development Issues

**Problem**: "Module not found" errors
```bash
cd api
rm -rf node_modules package-lock.json
npm install
```

**Problem**: CORS errors in browser
- Ensure `local.settings.json` has CORS configured
- Check that the frontend is calling the correct API endpoint

**Problem**: "ANTHROPIC_API_KEY is not set"
- Verify `local.settings.json` exists in the `api` directory
- Ensure the API key is valid and not expired

### Azure Deployment Issues

**Problem**: Build fails in GitHub Actions
- Check the Actions log for specific errors
- Verify all secrets are properly set
- Ensure the branch name matches the workflow trigger

**Problem**: API returns 500 errors
- Check Application Insights logs in Azure Portal
- Verify the `ANTHROPIC_API_KEY` environment variable is set in Azure
- Check Azure Functions logs

**Problem**: Frontend can't connect to API
- Verify the API location in `staticwebapp.config.json`
- Check browser console for CORS errors
- Ensure the Azure Functions app is running

## Security Considerations

- **API Key Protection**: Never commit `local.settings.json` or `.env` files
- **CORS Configuration**: Update `ALLOWED_ORIGINS` to your specific domain in production
- **Rate Limiting**: Consider implementing rate limiting for production use
- **Authentication**: Add Azure AD authentication for production deployments
- **HTTPS**: Always use HTTPS in production (automatically provided by Azure Static Web Apps)

## Cost Estimation

### Azure Costs
- **Static Web Apps**: Free tier available (100 GB bandwidth/month)
- **Azure Functions**: Consumption plan - Free grant of 1M requests/month
- **Estimated**: $0-5/month for low to moderate traffic

### Anthropic API Costs
- **Claude 3.5 Sonnet**: ~$3 per million input tokens, ~$15 per million output tokens
- **Estimated**: Varies based on usage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
- Create an issue in this repository
- Check [Azure Static Web Apps documentation](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- Check [Azure Functions documentation](https://learn.microsoft.com/en-us/azure/azure-functions/)
- Check [Anthropic API documentation](https://docs.anthropic.com/)

## Acknowledgments

- Built with [Anthropic Claude](https://www.anthropic.com/)
- Deployed on [Azure Static Web Apps](https://azure.microsoft.com/services/app-service/static/)
- Backend powered by [Azure Functions](https://azure.microsoft.com/services/functions/)
