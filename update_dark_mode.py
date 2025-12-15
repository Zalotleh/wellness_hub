#!/usr/bin/env python3
"""
Script to update all text colors for better dark mode visibility
Replaces gray-400 and gray-600 with gray-200/gray-300 in dark mode
"""

import os
import re
from pathlib import Path

# Define replacement patterns
replacements = [
    # Main text colors
    (r'text-gray-600(?!["\s]*dark)', r'text-gray-600 dark:text-gray-200'),
    (r'text-gray-500(?!["\s]*dark)', r'text-gray-500 dark:text-gray-300'),
    (r'text-gray-400(?!["\s]*dark)', r'text-gray-400 dark:text-gray-300'),
    
    # Background colors for cards
    (r'bg-gray-50(?!["\s]*dark)(["\s])', r'bg-gray-50 dark:bg-gray-700\1'),
    (r'bg-gray-100(?!["\s]*dark)(["\s])', r'bg-gray-100 dark:bg-gray-700\1'),
    
    # Hover states
    (r'hover:bg-gray-50(?!["\s]*dark)', r'hover:bg-gray-50 dark:hover:bg-gray-700'),
    (r'hover:bg-gray-100(?!["\s]*dark)', r'hover:bg-gray-100 dark:hover:bg-gray-700'),
    (r'hover:text-gray-800(?!["\s]*dark)', r'hover:text-gray-800 dark:hover:text-gray-100'),
    (r'hover:text-gray-900(?!["\s]*dark)', r'hover:text-gray-900 dark:hover:text-white'),
]

# Directories to process
directories = [
    'app/(dashboard)',
    'app/(auth)',
    'components'
]

def process_file(file_path):
    """Process a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all replacements
        for pattern, replacement in replacements:
            content = re.sub(pattern, replacement, content)
        
        # Only write if content changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
    return False

def main():
    """Main function"""
    base_path = Path(__file__).parent
    files_updated = 0
    
    for directory in directories:
        dir_path = base_path / directory
        if not dir_path.exists():
            continue
            
        # Find all .tsx files
        for tsx_file in dir_path.rglob('*.tsx'):
            if process_file(tsx_file):
                files_updated += 1
                print(f"✓ Updated: {tsx_file.relative_to(base_path)}")
    
    print(f"\n✅ Updated {files_updated} files with better dark mode colors")

if __name__ == '__main__':
    main()
