#!/bin/bash

# Repository Backup Script
# Creates comprehensive backups of the repository including git history and files

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_NAME="${BACKUP_NAME:-repo-backup-$(date +%Y%m%d_%H%M%S)}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository!"
        exit 1
    fi
}

# Create backup directory
create_backup_dir() {
    local backup_path="$BACKUP_DIR/$BACKUP_NAME"

    if [[ -d "$backup_path" ]]; then
        log_warning "Backup directory already exists: $backup_path"
        backup_path="$backup_path-$(date +%s)"
        log_info "Using: $backup_path"
    fi

    mkdir -p "$backup_path"
    echo "$backup_path"
}

# Create backup metadata
create_backup_metadata() {
    local backup_path="$1"
    local metadata_file="$backup_path/backup-metadata.json"

    log_info "Creating backup metadata..."

    cat > "$metadata_file" << EOF
{
    "backup_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "repository_path": "$(pwd)",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo 'detached')",
    "git_commit": "$(git rev-parse HEAD)",
    "git_remote": "$(git remote get-url origin 2>/dev/null || echo 'no-remote')",
    "backup_script_version": "1.0",
    "hostname": "$(hostname)",
    "user": "$(whoami)"
}
EOF

    log_success "Metadata created: $metadata_file"
}

# Create git bundle backup
create_git_bundle() {
    local backup_path="$1"
    local bundle_file="$backup_path/repository.bundle"

    log_info "Creating git bundle backup..."

    # Create bundle with all branches and tags
    if git bundle create "$bundle_file" --all; then
        log_success "Git bundle created: $bundle_file"

        # Verify bundle
        if git bundle verify "$bundle_file" > /dev/null 2>&1; then
            log_success "Git bundle verification passed"
        else
            log_warning "Git bundle verification failed"
        fi

        # Show bundle size
        local bundle_size=$(du -h "$bundle_file" | cut -f1)
        log_info "Bundle size: $bundle_size"
    else
        log_error "Failed to create git bundle"
        return 1
    fi
}

# Create file archive
create_file_archive() {
    local backup_path="$1"
    local archive_file="$backup_path/files.tar.gz"

    log_info "Creating file archive..."

    # Create exclude patterns file
    local exclude_file="$backup_path/.backup-exclude"
    cat > "$exclude_file" << EOF
.git
.DS_Store
**/.DS_Store
node_modules
**/node_modules
backups
.backup-exclude
*.tmp
*.log
*.swp
*~
EOF

    # Create archive excluding common directories
    if tar -czf "$archive_file" \
        --exclude-from="$exclude_file" \
        --exclude="$backup_path" \
        .; then
        log_success "File archive created: $archive_file"

        # Show archive size
        local archive_size=$(du -h "$archive_file" | cut -f1)
        log_info "Archive size: $archive_size"
    else
        log_error "Failed to create file archive"
        return 1
    fi

    # Remove temporary exclude file
    rm -f "$exclude_file"
}

# Create git information files
create_git_info() {
    local backup_path="$1"

    log_info "Creating git information files..."

    # Recent commit history
    git log --oneline -50 > "$backup_path/recent-commits.txt" 2>/dev/null || true

    # Current git status
    git status --porcelain > "$backup_path/git-status.txt" 2>/dev/null || true

    # Branch information
    git branch -a > "$backup_path/branches.txt" 2>/dev/null || true

    # Tags
    git tag -l > "$backup_path/tags.txt" 2>/dev/null || true

    # Remote information
    git remote -v > "$backup_path/remotes.txt" 2>/dev/null || true

    log_success "Git information files created"
}

# Create file listing
create_file_listing() {
    local backup_path="$1"

    log_info "Creating file listing..."

    # Create comprehensive file listing
    find . -type f \
        -not -path './.git/*' \
        -not -path './node_modules/*' \
        -not -path '**/node_modules/*' \
        -not -path './backups/*' \
        -not -path './.DS_Store' \
        -not -path '**/.DS_Store' \
        | sort > "$backup_path/file-listing.txt"

    # Create directory structure
    find . -type d \
        -not -path './.git/*' \
        -not -path './node_modules/*' \
        -not -path '**/node_modules/*' \
        -not -path './backups/*' \
        | sort > "$backup_path/directory-structure.txt"

    log_success "File listing created"
}

# Clean old backups
cleanup_old_backups() {
    local backup_dir="$1"

    log_info "Cleaning up backups older than $RETENTION_DAYS days..."

    if [[ -d "$backup_dir" ]]; then
        # Find and remove old backup directories
        find "$backup_dir" -maxdepth 1 -type d -name "repo-backup-*" -mtime +$RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true

        local remaining=$(find "$backup_dir" -maxdepth 1 -type d -name "repo-backup-*" | wc -l)
        log_info "Remaining backups: $remaining"
    fi
}

# Generate backup report
generate_report() {
    local backup_path="$1"
    local report_file="$backup_path/backup-report.txt"

    log_info "Generating backup report..."

    cat > "$report_file" << EOF
REPOSITORY BACKUP REPORT
========================

Backup Details:
- Timestamp: $(date)
- Backup Name: $BACKUP_NAME
- Repository: $(pwd)
- Git Branch: $(git branch --show-current 2>/dev/null || echo 'detached')
- Git Commit: $(git rev-parse HEAD)

Backup Contents:
$(ls -la "$backup_path")

File Sizes:
$(du -h "$backup_path"/* 2>/dev/null || echo "No files found")

Total Backup Size:
$(du -sh "$backup_path" | cut -f1)

Git Repository Info:
- Total commits: $(git rev-list --all --count 2>/dev/null || echo 'unknown')
- Total branches: $(git branch -a | wc -l)
- Total tags: $(git tag | wc -l)

Backup Status: SUCCESS
EOF

    log_success "Backup report created: $report_file"
}

# Main backup function
main() {
    local start_time=$(date +%s)

    log_info "Starting repository backup: $BACKUP_NAME"

    # Verify git repository
    check_git_repo

    # Create backup directory
    local backup_path
    backup_path=$(create_backup_dir)

    # Create backup components
    create_backup_metadata "$backup_path"
    create_git_bundle "$backup_path"
    create_file_archive "$backup_path"
    create_git_info "$backup_path"
    create_file_listing "$backup_path"
    generate_report "$backup_path"

    # Cleanup old backups
    cleanup_old_backups "$BACKUP_DIR"

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_success "Backup completed successfully!"
    log_info "Backup location: $backup_path"
    log_info "Total backup size: $(du -sh "$backup_path" | cut -f1)"
    log_info "Duration: ${duration} seconds"

    # Show final backup contents
    echo
    log_info "Backup contents:"
    ls -la "$backup_path/"
}

# Script usage
usage() {
    cat << EOF
Repository Backup Script

Usage: $0 [OPTIONS]

OPTIONS:
    -d, --dir DIR          Backup directory (default: ./backups)
    -n, --name NAME        Backup name (default: repo-backup-TIMESTAMP)
    -r, --retention DAYS   Retention period in days (default: 30)
    -h, --help            Show this help message

ENVIRONMENT VARIABLES:
    BACKUP_DIR            Override default backup directory
    BACKUP_NAME           Override default backup name
    RETENTION_DAYS        Override default retention period

EXAMPLES:
    $0                                    # Basic backup
    $0 -d /path/to/backups               # Custom backup directory
    $0 -n my-backup -r 7                 # Custom name and 7-day retention
    BACKUP_DIR=/tmp/backups $0           # Using environment variable

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -n|--name)
            BACKUP_NAME="$2"
            shift 2
            ;;
        -r|--retention)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi