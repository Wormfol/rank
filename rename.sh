#!/bin/bash

# Navigate to the img directory (adjust path if needed)
cd img

# Loop through all .png files
for file in *.png; do
  # Skip if no .png files are found
  [ -e "$file" ] || continue

  # Extract base filename without extension
  base="${file%.png}"

  # Rename to .jpg
  mv "$file" "$base.jpg"
done

echo "All .png files renamed to .jpg."
