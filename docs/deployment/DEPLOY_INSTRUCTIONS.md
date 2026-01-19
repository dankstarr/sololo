# 🚀 Quick Deployment Instructions

Follow these steps to publish Sololo to GitHub and Vercel.

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon → **"New repository"**
3. Repository name: `sololo`
4. Description: "AI-powered travel companion for smarter, social travel"
5. Choose **Public** or **Private**
6. **DO NOT** check "Initialize with README" (we already have one)
7. Click **"Create repository"**

## Step 2: Push to GitHub

Run these commands in your terminal (from the project directory):

```bash
# Make sure you're in the project directory
cd /Users/yxx492/Documents/projects/sololo

# Check git status (should show files ready to commit)
git status

# If not already committed, commit all files
git add .
git commit -m "Initial commit: Sololo travel companion app"

# Add your GitHub repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/sololo.git

# Rename branch to main if needed
git branch -M main

# Push to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

## Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** → Choose **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub
4. Click **"Add New..."** → **"Project"**
5. Find and select your `sololo` repository
6. Click **"Import"**
7. Vercel will auto-detect Next.js settings (no changes needed)
8. Click **"Deploy"**
9. Wait 1-2 minutes for deployment
10. Your app is live! 🎉

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project directory)
vercel

# Follow the prompts:
# - Link to existing project? No (first time)
# - Project name: sololo
# - Directory: ./
# - Override settings? No

# For production deployment
vercel --prod
```

## Step 4: Update README

After deployment, update the README:

1. Open `README.md`
2. Replace `yourusername` with your GitHub username
3. Replace the Vercel URL with your actual deployment URL
4. Commit and push:
   ```bash
   git add README.md
   git commit -m "Update README with deployment info"
   git push
   ```

## ✅ Success Checklist

- [ ] Repository created on GitHub
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project deployed on Vercel
- [ ] App is accessible at `https://sololo.vercel.app` (or your custom domain)
- [ ] README updated with correct links

## 🔄 Continuous Deployment

Once set up:
- Every push to `main` = automatic production deployment
- Every pull request = preview deployment
- No manual deployment needed!

## 🌐 Custom Domain (Optional)

1. Go to your project on Vercel
2. Settings → Domains
3. Add your custom domain
4. Follow DNS instructions
5. SSL certificate auto-provisioned

## 📊 Next Steps

1. **Set up Analytics**: Enable Vercel Analytics in dashboard
2. **Add Environment Variables**: If you need API keys later
3. **Monitor Performance**: Check Vercel Analytics dashboard
4. **Custom Domain**: Add your domain if you have one

## 🆘 Troubleshooting

### Git Push Fails
- Make sure you've created the GitHub repository first
- Check your GitHub username is correct
- Verify you have write access to the repository

### Vercel Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Run `npm run build` locally to test

### Need Help?
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide
- Vercel Docs: https://vercel.com/docs
- GitHub Docs: https://docs.github.com

---

**Your app will be live in minutes!** 🚀
