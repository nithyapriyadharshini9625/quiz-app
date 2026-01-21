# How to Upload Quiz App to GitHub

## Prerequisites
- Git installed on your computer ([Download Git](https://git-scm.com/downloads))
- GitHub account ([Sign up](https://github.com/signup))

## Step 1: Initialize Git Repository

Open your terminal/command prompt and navigate to the quiz-app folder:

```bash
cd E:\Nithya\cursor_ai_projects\quiz-app
```

Initialize a Git repository:

```bash
git init
```

## Step 2: Configure Git (if not already done)

Set your name and email (use your GitHub email):

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 3: Add All Files

Add all files to Git (except those in .gitignore):

```bash
git add .
```

## Step 4: Create Initial Commit

Commit your files:

```bash
git commit -m "Initial commit: Quiz App project"
```

## Step 5: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `quiz-app` (or any name you prefer)
   - **Description**: "Full-stack quiz application with React and Node.js"
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** check "Initialize with README" (we already have files)
5. Click **"Create repository"**

## Step 6: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/quiz-app.git

# Rename default branch to main (if needed)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

**Example** (if your username is `nithyapriyadharshini9625`):
```bash
git remote add origin https://github.com/nithyapriyadharshini9625/quiz-app.git
git branch -M main
git push -u origin main
```

## Step 7: Enter GitHub Credentials

When you run `git push`, you'll be prompted for:
- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your GitHub password)

### How to Create Personal Access Token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **"Generate new token (classic)"**
3. Give it a name (e.g., "Quiz App")
4. Select scopes: Check **"repo"** (this gives full repository access)
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

## Step 8: Verify Upload

1. Go to your GitHub repository page
2. You should see all your files uploaded
3. Refresh the page if needed

## Future Updates

When you make changes to your code:

```bash
# Navigate to project folder
cd E:\Nithya\cursor_ai_projects\quiz-app

# Check what files changed
git status

# Add changed files
git add .

# Commit changes
git commit -m "Description of your changes"

# Push to GitHub
git push
```

## Important Notes

### ⚠️ Never Commit These Files:
- `.env` files (contain sensitive data like API keys)
- `node_modules/` folder (too large, can be reinstalled)
- Personal credentials or secrets

These are already in `.gitignore`, so they won't be uploaded.

### 🔒 Security Checklist:
- ✅ `.env` files are in `.gitignore`
- ✅ No API keys or secrets in code
- ✅ `node_modules/` is ignored
- ✅ Personal information is removed

## Troubleshooting

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/quiz-app.git
```

### Error: "failed to push some refs"
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Error: Authentication failed
- Make sure you're using a Personal Access Token, not your password
- Check that the token has "repo" permissions

## Quick Command Reference

```bash
# Initialize repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# Check status
git status

# View commit history
git log
```

## Next Steps

After uploading:
1. Add a README.md file to describe your project
2. Add a LICENSE file if you want to open-source it
3. Consider adding GitHub Actions for CI/CD
4. Add collaborators if working in a team

---

**Need Help?** Check [GitHub Docs](https://docs.github.com) or [Git Documentation](https://git-scm.com/doc)

