# GitHub Actions Deployment Setup

This guide walks you through setting up automatic deployments from GitHub to your DigitalOcean droplet using GitHub Actions.

## Prerequisites

Before configuring GitHub Actions, ensure your DigitalOcean droplet is set up following the steps in `README.md` under "Deploy to DigitalOcean":

- ✅ Node.js 20 installed
- ✅ MongoDB running (or using Atlas)
- ✅ PM2 installed and running the app (`pm2 start server.js --name "travel-curator"`)
- ✅ Repository pushed to GitHub

## Step 1: Generate SSH Key (if not already done)

On your local machine:

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/do_deploy -N ""
```

This creates two files:
- `~/.ssh/do_deploy` (private key — keep secret)
- `~/.ssh/do_deploy.pub` (public key — add to droplet)

## Step 2: Add Public Key to DigitalOcean Droplet

SSH into your droplet and add the public key:

```bash
# On your local machine
cat ~/.ssh/do_deploy.pub | ssh root@YOUR_DROPLET_IP "cat >> ~/.ssh/authorized_keys"
```

Or manually:

```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Add the public key
echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## Step 3: Configure GitHub Secrets

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add these four secrets:

| Secret Name | Value | Example |
|---|---|---|
| `DO_HOST` | Your DigitalOcean droplet IP | `192.0.2.123` |
| `DO_USER` | SSH username (usually `root`) | `root` |
| `DO_SSH_KEY` | Contents of `~/.ssh/do_deploy` (private key) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DO_SSH_PORT` | SSH port (default `22`) | `22` |

**To get your private key content:**

```bash
cat ~/.ssh/do_deploy
```

Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`) and paste it into the `DO_SSH_KEY` secret.

## Step 4: Verify Deployment

1. Push code to the `main` branch:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

2. Go to your GitHub repository → **Actions** tab
3. You should see your workflow running
4. Click on the workflow run to see detailed logs

## What the Workflow Does

On every push to `main`, the workflow:

1. ✅ Pulls the latest code from GitHub
2. ✅ Installs production dependencies (`npm install --production`)
3. ✅ Restarts the PM2 app
4. ✅ Displays PM2 status and recent logs

## Troubleshooting

### ❌ SSH Authentication Failed

**Problem:** `Permission denied (publickey)`

**Solution:**
1. Verify the private key is correctly added as `DO_SSH_KEY` secret
2. Check that the public key is in `~/.ssh/authorized_keys` on the droplet:
   ```bash
   ssh root@YOUR_DROPLET_IP "cat ~/.ssh/authorized_keys"
   ```

### ❌ Git Pull Failed

**Problem:** `fatal: not a git repository`

**Solution:**
- Ensure the repository was cloned to `/var/www/travel-curator` on the droplet:
  ```bash
  ssh root@YOUR_DROPLET_IP "ls -la /var/www/travel-curator/.git"
  ```

### ❌ PM2 Restart Failed

**Problem:** `pm2: command not found`

**Solution:**
- Verify PM2 is installed on the droplet:
  ```bash
  ssh root@YOUR_DROPLET_IP "pm2 --version"
  ```

### ✅ Check Logs on Droplet

To manually check what's happening:

```bash
ssh root@YOUR_DROPLET_IP
pm2 logs travel-curator --lines 50
pm2 status
```

## Manual Deployment (if needed)

If the workflow fails, you can deploy manually:

```bash
ssh root@YOUR_DROPLET_IP
cd /var/www/travel-curator
git pull origin main
npm install --production
pm2 restart travel-curator
pm2 logs travel-curator
```

## Security Best Practices

- ✅ Never commit SSH keys to GitHub
- ✅ Rotate SSH keys periodically
- ✅ Use a separate deploy key instead of your personal SSH key
- ✅ Restrict the deploy key's permissions (read-only access to repo)
- ✅ Monitor GitHub Actions workflow runs regularly
