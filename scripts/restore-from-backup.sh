#!/bin/bash

# Repository Restore Script
# Restores repository from backup created by backup-repository.sh

set -euo pipefail

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

# Configuration
BACKUP_PATH=""
RESTORE_DIR=""
RESTORE_TYPE="full"  # full, git-only, files-only

# Script usage
usage() {
    cat << EOF
Repository Restore Script

Usage: $0 -b BACKUP_PATH [OPTIONS]

REQUIRED:
    -b, --backup PATH     Path to backup directory

OPTIONS:
    -d, --dir DIR         Restore destination directory (default: ./restored-repo)
    -t, --type TYPE       Restore type: full, git-only, files-only (default: full)
    --list               List available backups and exit
    -h, --help           Show this help message

RESTORE TYPES:
    full                 Restore both git repository and files
    git-only            Restore only git repository from bundle
    files-only          Restore only files from archive

EXAMPLES:
    $0 -b ./backups/repo-backup-20241201_120000              # Full restore
    $0 -b ./backups/repo-backup-20241201_120000 -t git-only  # Git only
    $0 --list ./backups                                      # List backups

EOF
}

# List available backups
list_backups() {
    local backup_dir="$1"

    if [[ ! -d "$backup_dir" ]]; then
        log_error "Backup directory does not exist: $backup_dir"
        exit 1
    fi

    log_info "Available backups in $backup_dir:"
    echo

    local found_backups=false
    for backup in "$backup_dir"/repo-backup-*; do
        if [[ -d "$backup" ]]; then
            found_backups=true
            local backup_name=$(basename "$backup")
            local backup_size=$(du -sh "$backup" 2>/dev/null | cut -f1 || echo "unknown")
            local backup_date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$backup" 2>/dev/null || echo "unknown")

            printf "  %-40s %10s  %s\n" "$backup_name" "$backup_size" "$backup_date"

            # Show backup contents if metadata exists
            if [[ -f "$backup/backup-metadata.json" ]]; then
                local git_commit=$(grep -o '"git_commit": "[^"]*"' "$backup/backup-metadata.json" 2>/dev/null | cut -d'"' -f4 || echo "unknown")
                local git_branch=$(grep -o '"git_branch": "[^"]*"' "$backup/backup-metadata.json" 2>/dev/null | cut -d'"' -f4 || echo "unknown")
                printf "    Branch: %-20s Commit: %.8s\n" "$git_branch" "$git_commit"
            fi
            echo
        fi
    done

    if [[ "$found_backups" == false ]]; then
        log_warning "No backups found in $backup_dir"
        log_info "Backup directories should be named like: repo-backup-YYYYMMDD_HHMMSS"
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_path="$1"

    log_info "Verifying backup integrity..."

    # Check if backup directory exists
    if [[ ! -d "$backup_path" ]]; then
        log_error "Backup directory does not exist: $backup_path"
        return 1
    fi

    # Check for required files based on restore type
    local missing_files=()

    if [[ "$RESTORE_TYPE" == "full" || "$RESTORE_TYPE" == "git-only" ]]; then
        if [[ ! -f "$backup_path/repository.bundle" ]]; then
            missing_files+=("repository.bundle")
        fi
    fi

    if [[ "$RESTORE_TYPE" == "full" || "$RESTORE_TYPE" == "files-only" ]]; then
        if [[ ! -f "$backup_path/files.tar.gz" ]]; then
            missing_files+=("files.tar.gz")
        fi
    fi

    if [[ ${#missing_files[@]} -gt 0 ]]; then
        log_error "Missing required backup files:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        return 1
    fi

    # Verify git bundle if present
    if [[ -f "$backup_path/repository.bundle" && ("$RESTORE_TYPE" == "full" || "$RESTORE_TYPE" == "git-only") ]]; then
        if ! git bundle verify "$backup_path/repository.bundle" > /dev/null 2>&1; then
            log_error "Git bundle verification failed!"
            return 1
        fi
    fi

    log_success "Backup verification passed"
    return 0
}

# Show backup information
show_backup_info() {
    local backup_path="$1"

    log_info "Backup Information:"

    # Show metadata if available
    if [[ -f "$backup_path/backup-metadata.json" ]]; then
        echo "Metadata:"
        cat "$backup_path/backup-metadata.json" | sed 's/^/  /'
        echo
    fi

    # Show backup report if available
    if [[ -f "$backup_path/backup-report.txt" ]]; then
        echo "Backup Report:"
        cat "$backup_path/backup-report.txt" | sed 's/^/  /'
        echo
    fi

    # Show backup contents
    echo "Backup Contents:"
    ls -la "$backup_path/" | sed 's/^/  /'
    echo

    # Show total size
    local total_size=$(du -sh "$backup_path" | cut -f1)
    echo "Total Backup Size: $total_size"
    echo
}

# Restore git repository
restore_git_repository() {
    local backup_path="$1"
    local restore_dir="$2"

    log_info "Restoring git repository..."

    local bundle_file="$backup_path/repository.bundle"

    # Create restore directory
    mkdir -p "$restore_dir"

    # Clone from bundle
    if git clone "$bundle_file" "$restore_dir/.git-restore" 2>/dev/null; then
        # Move .git directory to final location
        mv "$restore_dir/.git-restore/.git" "$restore_dir/"
        rm -rf "$restore_dir/.git-restore"

        # Set up working directory
        cd "$restore_dir"
        git checkout HEAD -- . 2>/dev/null || true

        log_success "Git repository restored to: $restore_dir"

        # Show git information
        echo "Restored repository information:"
        echo "  Branch: $(git branch --show-current 2>/dev/null || echo 'detached')"
        echo "  Commit: $(git rev-parse HEAD)"
        echo "  Branches: $(git branch -a | wc -l)"
        echo "  Tags: $(git tag | wc -l)"
    else
        log_error "Failed to restore git repository from bundle"
        return 1
    fi
}

# Restore files
restore_files() {
    local backup_path="$1"
    local restore_dir="$2"

    log_info "Restoring files..."

    local archive_file="$backup_path/files.tar.gz"

    # Create restore directory
    mkdir -p "$restore_dir"

    # Extract files
    if tar -xzf "$archive_file" -C "$restore_dir"; then
        log_success "Files restored to: $restore_dir"

        # Show file count
        local file_count=$(find "$restore_dir" -type f | wc -l)
        echo "Restored files: $file_count"
    else
        log_error "Failed to restore files from archive"
        return 1
    fi
}

# Main restore function
main() {
    local start_time=$(date +%s)

    # Validate inputs
    if [[ -z "$BACKUP_PATH" ]]; then
        log_error "Backup path is required"
        usage
        exit 1
    fi

    # Set default restore directory
    if [[ -z "$RESTORE_DIR" ]]; then
        RESTORE_DIR="./restored-repo-$(date +%Y%m%d_%H%M%S)"
    fi

    log_info "Starting repository restore"
    log_info "Backup path: $BACKUP_PATH"
    log_info "Restore directory: $RESTORE_DIR"
    log_info "Restore type: $RESTORE_TYPE"

    # Verify backup
    if ! verify_backup "$BACKUP_PATH"; then
        log_error "Backup verification failed"
        exit 1
    fi

    # Show backup information
    show_backup_info "$BACKUP_PATH"

    # Check if restore directory exists
    if [[ -d "$RESTORE_DIR" ]]; then
        log_warning "Restore directory already exists: $RESTORE_DIR"
        read -p "Continue? This may overwrite existing files (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Restore cancelled"
            exit 0
        fi
    fi

    # Perform restore based on type
    case "$RESTORE_TYPE" in
        "full")
            restore_git_repository "$BACKUP_PATH" "$RESTORE_DIR"
            restore_files "$BACKUP_PATH" "$RESTORE_DIR"
            ;;
        "git-only")
            restore_git_repository "$BACKUP_PATH" "$RESTORE_DIR"
            ;;
        "files-only")
            restore_files "$BACKUP_PATH" "$RESTORE_DIR"
            ;;
        *)
            log_error "Invalid restore type: $RESTORE_TYPE"
            exit 1
            ;;
    esac

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_success "Restore completed successfully!"
    log_info "Restored to: $RESTORE_DIR"
    log_info "Duration: ${duration} seconds"

    # Show final directory contents
    echo
    log_info "Restored directory contents:"
    ls -la "$RESTORE_DIR/" | head -20
    if [[ $(ls -la "$RESTORE_DIR/" | wc -l) -gt 21 ]]; then
        echo "... (showing first 20 entries)"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--backup)
            BACKUP_PATH="$2"
            shift 2
            ;;
        -d|--dir)
            RESTORE_DIR="$2"
            shift 2
            ;;
        -t|--type)
            RESTORE_TYPE="$2"
            shift 2
            ;;
        --list)
            if [[ -n "${2-}" && "${2:0:1}" != "-" ]]; then
                list_backups "$2"
                shift 2
            else
                list_backups "./backups"
                shift
            fi
            exit 0
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