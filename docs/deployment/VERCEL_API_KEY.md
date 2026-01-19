# Vercel API Key Setup

## How to Get Your Vercel API Key

### Step 1: Get Your API Token

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Give it a name (e.g., "Sololo Deployment")
4. Set expiration (or leave as "No expiration")
5. Click **"Create"**
6. **Copy the token immediately** - you won't be able to see it again!

### Step 2: Use the API Key

#### Option A: Environment Variable (Recommended)

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export VERCEL_TOKEN=your_vercel_token_here
```

Then reload:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

#### Option B: Vercel CLI Login

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login with your API token
vercel login

# Or use the token directly
vercel login --token your_vercel_token_here
```

#### Option C: Use in Commands

```bash
# Set token for single command
VERCEL_TOKEN=your_token_here vercel --prod

# Or export before commands
export VERCEL_TOKEN=your_token_here
vercel --prod
```

## Deploy Using API Key

Once you have your token, deploy with:

```bash
# Link project (first time only)
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Security Best Practices

1. **Never commit** your Vercel token to git
2. **Add to `.env.local`** for local development (already gitignored)
3. **Use environment variables** in CI/CD pipelines
4. **Rotate tokens** regularly
5. **Use scoped tokens** with limited permissions when possible

## Troubleshooting

**Token not working?**
- Verify token is copied correctly (no extra spaces)
- Check token hasn't expired
- Ensure you're logged into the correct Vercel account

**Permission denied?**
- Verify token has correct permissions
- Check you have access to the project/team

## Next Steps

After getting your API key:
1. Set it as an environment variable
2. Run `vercel link` to connect your local project
3. Run `vercel --prod` to deploy
