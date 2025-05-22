#!/bin/sh

# get diff files
last_diff=$(git log --oneline | grep -m2 'Merge branch' | head -n1 |  awk '{print $1}')
diff_files=$(git diff HEAD "$last_diff" | grep 'diff --git' | uniq | awk '{print $3}'| grep src/sources | sed 's|src/sources/||g' | sed 's|.ts||g' | sed 's|./||g')

if [ -z "$diff_files" ]
then
  echo "found nothing to test"
  exit 0
fi

# disable socks5 proxy
export SOCKS5=''

echo "$diff_files" | xargs npm run test
