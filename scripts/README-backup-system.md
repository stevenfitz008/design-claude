# GitHub Repository Backup System

A comprehensive backup solution that creates hourly backups of your GitHub repository, including full git history and working files.

## 🚀 Quick Start

### Automatic Hourly Backups (GitHub Actions)

The backup system automatically runs every hour via GitHub Actions. No setup required - just commit the workflow file and it starts working.

**What it backs up:**
- Complete git repository (all branches, tags, history)
- All working files (excluding node_modules, .git, etc.)
- Git metadata and commit information
- File listings and directory structure

**Storage:**
- GitHub Actions artifacts (free with usage limits)
- 30-day retention period
- Automatic cleanup of old backups

### Manual Backup

For immediate backups or testing:

```bash
# Create a backup now
./scripts/backup-repository.sh

# Custom backup location
./scripts/backup-repository.sh -d /path/to/backups

# Custom retention period (7 days)
./scripts/backup-repository.sh -r 7
```

## 📋 System Components

### 1. GitHub Actions Workflow (`.github/workflows/hourly-backup.yml`)

**Schedule:** Runs every hour at minute 0 (UTC)
**Triggers:**
- Automatic: `0 * * * *` (hourly)
- Manual: Workflow dispatch button in GitHub Actions

**Features:**
- Complete repository backup with verification
- Metadata tracking (commit, branch, timestamp)
- Automatic artifact upload with compression
- Error handling and status reporting
- 30-day retention with automatic cleanup

### 2. Manual Backup Script (`scripts/backup-repository.sh`)

**Usage:**
```bash
./scripts/backup-repository.sh [OPTIONS]

OPTIONS:
    -d, --dir DIR          Backup directory (default: ./backups)
    -n, --name NAME        Backup name (default: repo-backup-TIMESTAMP)
    -r, --retention DAYS   Retention period in days (default: 30)
    -h, --help            Show help message
```

**Features:**
- Complete git bundle creation with verification
- File archive with smart exclusions
- Comprehensive metadata and git information
- Automatic cleanup of old backups
- Detailed backup reports

### 3. Restore Script (`scripts/restore-from-backup.sh`)

**Usage:**
```bash
./scripts/restore-from-backup.sh -b BACKUP_PATH [OPTIONS]

OPTIONS:
    -b, --backup PATH     Path to backup directory (required)
    -d, --dir DIR         Restore destination directory
    -t, --type TYPE       Restore type: full, git-only, files-only
    --list               List available backups
```

**Restore Types:**
- `full`: Complete restoration (git + files)
- `git-only`: Only git repository from bundle
- `files-only`: Only files from archive

### 4. Configuration (`/.github/backup-config.yml`)

Centralized configuration for backup behavior:
- Schedule settings (cron expression)
- Retention policies
- Include/exclude patterns
- Verification settings
- Storage configuration

## 📁 Backup Structure

Each backup contains:

```
repo-backup-YYYYMMDD_HHMMSS/
├── backup-metadata.json       # Backup metadata and git info
├── repository.bundle          # Complete git repository
├── files.tar.gz              # Working directory files
├── recent-commits.txt         # Recent commit history
├── git-status.txt            # Git status at backup time
├── branches.txt              # All branches
├── tags.txt                  # All tags
├── remotes.txt               # Remote configurations
├── file-listing.txt          # Complete file listing
├── directory-structure.txt   # Directory tree
└── backup-report.txt         # Comprehensive backup report
```

## 🔧 Configuration Options

### GitHub Actions Workflow

Edit `.github/workflows/hourly-backup.yml`:

```yaml
env:
  BACKUP_RETENTION_DAYS: 30    # How long to keep backups
  MAX_ARTIFACTS_PER_RUN: 24    # Max artifacts per day
```

**Schedule modification:**
```yaml
schedule:
  - cron: '0 * * * *'    # Every hour
  - cron: '0 */2 * * *'  # Every 2 hours
  - cron: '0 0 * * *'    # Daily at midnight
  - cron: '0 0 * * 0'    # Weekly on Sunday
```

### Manual Script Configuration

**Environment Variables:**
```bash
export BACKUP_DIR="/custom/backup/path"
export BACKUP_NAME="my-custom-backup"
export RETENTION_DAYS=7
```

**Command Line:**
```bash
./scripts/backup-repository.sh -d /custom/path -r 7
```

## 📊 Monitoring and Verification

### GitHub Actions

1. **View Workflow Runs**: GitHub → Actions → "Hourly Repository Backup"
2. **Download Artifacts**: Click on successful run → Artifacts section
3. **Check Logs**: View detailed execution logs for troubleshooting

### Manual Verification

```bash
# Test backup script
./scripts/backup-repository.sh -d ./test-backup

# List backups
./scripts/restore-from-backup.sh --list ./backups

# Verify backup integrity
git bundle verify ./backups/repo-backup-*/repository.bundle
```

## 🔄 Restore Process

### From GitHub Actions Artifacts

1. Download artifact from GitHub Actions
2. Extract the zip file
3. Use restore script:

```bash
# Extract downloaded artifact
unzip repo-backup-YYYY-MM-DD-XXh.zip

# Restore
./scripts/restore-from-backup.sh -b ./backup -d ./restored-repo
```

### From Manual Backups

```bash
# List available backups
./scripts/restore-from-backup.sh --list ./backups

# Full restore
./scripts/restore-from-backup.sh -b ./backups/repo-backup-20241201_120000

# Git repository only
./scripts/restore-from-backup.sh -b ./backups/repo-backup-20241201_120000 -t git-only

# Files only
./scripts/restore-from-backup.sh -b ./backups/repo-backup-20241201_120000 -t files-only
```

## 🚨 Emergency Recovery

### Complete Repository Loss

1. **Download latest backup** from GitHub Actions artifacts
2. **Extract and restore**:
   ```bash
   unzip repo-backup-latest.zip
   ./scripts/restore-from-backup.sh -b ./backup -d ./recovered-repo
   cd ./recovered-repo
   git remote add origin YOUR_GITHUB_URL
   ```

### Partial Data Loss

1. **Restore specific files**:
   ```bash
   ./scripts/restore-from-backup.sh -b ./backup -t files-only -d ./temp-restore
   cp ./temp-restore/path/to/lost/files ./current-repo/
   ```

2. **Restore git history**:
   ```bash
   git bundle clone ./backup/repository.bundle ./temp-repo
   cd ./temp-repo
   # Examine history and cherry-pick commits as needed
   ```

## 🔍 Troubleshooting

### Common Issues

**Backup Too Large:**
- GitHub has artifact size limits (2GB compressed)
- Exclude large files in workflow or script
- Consider external storage for very large repos

**Workflow Not Running:**
- Check GitHub Actions are enabled for repository
- Verify cron syntax in workflow file
- Check repository activity (workflows pause on inactive repos)

**Permission Errors:**
- Ensure scripts have execute permissions: `chmod +x scripts/*.sh`
- Check GitHub token permissions for private repositories

**Bundle Verification Failed:**
- Repository may be corrupted
- Check git repository health: `git fsck`
- Try creating fresh backup

### Debug Commands

```bash
# Test backup script with debug
bash -x ./scripts/backup-repository.sh

# Verify git repository health
git fsck --full

# Check backup file integrity
file ./backups/*/repository.bundle
file ./backups/*/files.tar.gz

# Test git bundle
git bundle verify ./backups/*/repository.bundle
git bundle list-heads ./backups/*/repository.bundle
```

## 📈 Best Practices

### Repository Maintenance

1. **Regular Cleanup**: Let automatic retention handle old backups
2. **Monitor Size**: Watch for unusual backup size increases
3. **Test Restores**: Periodically test backup restoration
4. **Document Changes**: Update backup config for repository changes

### Security Considerations

1. **Sensitive Data**: Never commit secrets or credentials
2. **Access Control**: Backup artifacts inherit repository permissions
3. **Retention Limits**: Don't keep backups longer than necessary
4. **External Storage**: Consider additional backup to external services

### Performance Optimization

1. **Exclude Large Files**: Add patterns to exclude files in config
2. **Compression**: Adjust compression level for speed vs. size trade-off
3. **Scheduling**: Adjust frequency based on repository activity
4. **Storage**: Monitor GitHub Actions storage usage

## 🆘 Support

### Get Help

```bash
# Script help
./scripts/backup-repository.sh --help
./scripts/restore-from-backup.sh --help

# List backups
./scripts/restore-from-backup.sh --list

# Test configuration
./scripts/backup-repository.sh -d ./test -n test-backup
```

### Logs and Debugging

- **GitHub Actions**: Check workflow logs in Actions tab
- **Script Logs**: Scripts provide detailed colored output
- **Git Commands**: Use `git bundle` commands for advanced debugging

### Emergency Contacts

In case of critical data loss:
1. **Stop all operations** that might overwrite data
2. **Document the situation** (what was lost, when, how)
3. **Download all available backups** immediately
4. **Test restoration** in a separate directory first

---

## 📝 Version History

- **v1.0**: Initial backup system with hourly GitHub Actions and manual scripts
- **Features**: Complete git + file backup, automatic retention, restore capability
- **Storage**: GitHub Actions artifacts with 30-day retention