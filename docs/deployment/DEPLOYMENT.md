# Deployment Guide

This guide will help you deploy Sololo to GitHub and Vercel.

## 📦 Step 1: Prepare for GitHub

### Initialize Git Repository

If you haven't already initialized git:

```bash
# Navigate to project directory
cd sololo

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Sololo travel companion app"
```

### Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Name it `sololo` (or your preferred name)
4. **Don't** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

### Push to GitHub

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/sololo.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## 🚀 Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub (recommended for easy integration)

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your `sololo` repository from GitHub
   - Vercel will auto-detect Next.js settings

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Environment Variables** (Optional)
   - Add any environment variables if needed:
     - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (if using Google Maps)
     - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (if using Google Sign-In)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (usually 1-2 minutes)
   - Your app will be live at `https://sololo.vercel.app` (or your custom domain)

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # From project root
   vercel

   # For production deployment
   vercel --prod
   ```

4. **Follow the prompts**
   - Link to existing project or create new
   - Confirm settings
   - Deploy!

## 🔄 Continuous Deployment

Once connected to Vercel:
- Every push to `main` branch = automatic production deployment
- Every pull request = preview deployment
- No manual deployment needed!

## 🌐 Custom Domain (Optional)

1. Go to your project on Vercel
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Vercel will automatically provision SSL certificate

## 📊 Monitoring

Vercel provides:
- **Analytics**: Page views, performance metrics
- **Logs**: Real-time deployment and runtime logs
- **Speed Insights**: Core Web Vitals tracking

## 🔧 Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version (should be 18+)
4. Check for TypeScript errors: `npm run build` locally

### Environment Variables Not Working

1. Ensure variables start with `NEXT_PUBLIC_` for client-side access
2. Redeploy after adding new variables
3. Check variable names match exactly

### Performance Issues

1. Check Vercel Analytics for bottlenecks
2. Review [Performance Guide](../guides/PERFORMANCE.md)
3. Enable Vercel Speed Insights

## 📝 Next Steps After Deployment

1. **Update README**: Replace `yourusername` with your GitHub username
2. **Add Badges**: Update deployment badge with your Vercel URL
3. **Configure Analytics**: Set up Vercel Analytics
4. **Set Up Monitoring**: Configure error tracking (optional)
5. **Custom Domain**: Add your domain if you have one

## 🎉 Success!

Your app should now be:
- ✅ On GitHub: `https://github.com/YOUR_USERNAME/sololo`
- ✅ Live on Vercel: `https://sololo.vercel.app`
- ✅ Auto-deploying on every push

Happy deploying! 🚀
