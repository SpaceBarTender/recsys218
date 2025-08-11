#!/bin/bash

output_file="combined.txt"

# Clear the output file if it exists
> "$output_file"

# Use find to exclude directories and image files.
# This command will:
# 1. Prune directories named __pycache__, node_modules, public, or assets.
# 2. For all other files, skip those with .png, .jpg, or .svg extensions (case-insensitive).
find . -type d \( -name "__pycache__" -o -name "node_modules" -o -name "public" -o -name "assets" \) -prune -o \
       -type f \( -not -iname "*.png" -and -not -iname "*.jpg" -and -not -iname "*.svg" \) \
       -print0 | while IFS= read -r -d '' file; do
    # Skip the output file itself if it's in the directory tree
    if [ "$file" = "./$output_file" ]; then
        continue
    fi
    # Skip any file named package-lock.json
    if [ "$(basename "$file")" = "package-lock.json" ]; then
        continue
    fi
    echo -e "\n\n------------------------- $file\n\n" >> "$output_file"
    cat "$file" >> "$output_file"
done

echo "All files have been concatenated into $output_file"

