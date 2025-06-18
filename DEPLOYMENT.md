# Automatic Deployment Setup

This guide will help you set up automatic deployment to Vercel when you push to GitHub.

## Option 1: Vercel Dashboard (Recommended - Easiest)

1. **Go to [vercel.com](https://vercel.com)** and sign up/login with your GitHub account

2. **Import your repository:**
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your GitHub repository
   - Vercel will automatically detect it's a Vite React app

3. **Configure the project:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically deploy your app and give you a URL

5. **Automatic deployments:**
   - Every push to `main` branch will automatically trigger a new deployment
   - Pull requests will create preview deployments

## Option 2: GitHub Actions (Advanced)

If you prefer using the GitHub Actions workflow I created:

1. **Get Vercel tokens:**
   - Install Vercel CLI: `npm i -g vercel`
   - Run `vercel login`
   - Run `vercel link` in your project directory
   - This will create a `.vercel` folder with your project ID

2. **Add GitHub Secrets:**
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add these secrets:
     - `VERCEL_TOKEN`: Get from [vercel.com/account/tokens](https://vercel.com/account/tokens)
     - `ORG_ID`: From `.vercel/project.json`
     - `PROJECT_ID`: From `.vercel/project.json`

3. **Push your code:**
   - The workflow will automatically run on pushes to main branch

## Environment Variables

Don't forget to add your Supabase environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Benefits of Vercel

- ✅ **Free hosting** for personal projects
- ✅ **Automatic deployments** on every push
- ✅ **Preview deployments** for pull requests
- ✅ **Global CDN** for fast loading
- ✅ **Custom domains** support
- ✅ **SSL certificates** included
- ✅ **Analytics** and performance monitoring

## Alternative Platforms

If you prefer other platforms:

- **Netlify**: Similar to Vercel, great for static sites
- **GitHub Pages**: Free but limited to static content
- **Firebase Hosting**: Google's hosting solution
- **Railway**: Good for full-stack apps

## Troubleshooting

If deployment fails:

1. Check the build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify environment variables are set correctly
4. Make sure the build command works locally: `npm run build` 