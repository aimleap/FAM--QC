#!/bin/bash

current_tag=$(jq -r .version package.json)
IFS='.' read -ra version_numbers <<< "$current_tag"
version_numbers[2]=$(expr "${version_numbers[2]}" + 1)
new_tag=$(IFS=. ; echo "${version_numbers[*]}")
echo "new tag: ${new_tag} from ${CI_COMMIT_BRANCH} branch"

git config user.email "$TEAM_X_EMAIL"
git config user.name "$TEAM_X_NAME"

jq --arg new_tag "$new_tag" '.version |= $new_tag' package.json > tmp.json
mv tmp.json package.json

res=$(curl -X GET "https://git.dataminr.com/api/v4/projects/1846/merge_requests?view=simple&scope=all&source_branch=${CI_COMMIT_BRANCH}" \
  --header "PRIVATE-TOKEN:${SCRAPER_LITE_GITLAB_TOKEN}")
res_clean=$(echo $res | tr '\r\n' ' ' )
mr_title=$(echo $res_clean | jq -r '.[0].title')

sed '2 i\
\
# '"${new_tag}"'\
+ '"${mr_title}"'\
' CHANGELOG.md > tmp.md
mv tmp.md CHANGELOG.md

curl -X POST "https://git.dataminr.com/api/v4/projects/1846/repository/commits" \
  --form "branch=${CI_COMMIT_BRANCH}" \
  --form "commit_message=updating tag and changelog to ${new_tag}" \
  --form "actions[][action]=update" \
  --form "actions[][file_path]=CHANGELOG.md" \
  --form "actions[][content]=<./CHANGELOG.md" \
  --form "actions[][action]=update" \
  --form "actions[][file_path]=package.json" \
  --form "actions[][content]=<./package.json" \
  --header "PRIVATE-TOKEN:${SCRAPER_LITE_GITLAB_TOKEN}"
