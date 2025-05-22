#!/bin/sh

TAG=$(jq -r .version package.json)
TAG_URL="git+ssh://git@git.dataminr.com:web-crawling/scraper-lite.git#${TAG}"
new_branch_name="scraper-lite_${TAG}"
mr_body="{
  \"id\": 1071,
  \"source_branch\": \"${new_branch_name}\",
  \"target_branch\": \"master\",
  \"title\": \"update scraper-lite tag to ${TAG}\",
  \"remove_source_branch\": \"true\",
  \"squash\": \"true\"
}"

cd ..
git clone git@git.dataminr.com:web-crawling/web-scraper.git
cd web-scraper
git config user.email "$TEAM_X_EMAIL"
git config user.name "$TEAM_X_NAME"
git checkout -b "$new_branch_name"
jq --arg TAG_URL $TAG_URL '.dependencies."scraper-lite" |= $TAG_URL' package.json > tmp.json
mv tmp.json package.json
git add package.json
git commit -m "updating scraper-lite tag"
git push --set-upstream origin "$new_branch_name"
curl -X POST "https://git.dataminr.com/api/v4/projects/1071/merge_requests" \
    --header "PRIVATE-TOKEN:${WEB_SCRAPER_GITLAB_TOKEN}" \
    --header "Content-Type: application/json" \
    --data "${mr_body}"
