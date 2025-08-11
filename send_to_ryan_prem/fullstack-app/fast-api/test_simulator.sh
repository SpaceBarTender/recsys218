#!/bin/bash
# test_simulator.sh
#
# This script simulates interactions for a single user with credentials:
#   Username: test
#   Password: 123
#
# It attempts to sign up (if needed), logs in, fetches recommendations, and simulates clicks on articles over several cycles.

API_URL="http://localhost:5000"
echo "Using API URL: $API_URL"

# User credentials
USERNAME="test"
PASSWORD="123"
OFFICE_CODE="J0"  # Adjust according to your configuration

echo "Starting simulation for user: $USERNAME"

# SIGNUP: Attempt to create the user. If the user already exists, proceed to login.
signup_response=$(curl -s -X POST "$API_URL/api/signup" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"${USERNAME}\", \"password\": \"${PASSWORD}\", \"office_code\": \"${OFFICE_CODE}\"}")
echo "Signup response: $signup_response"
if echo "$signup_response" | grep -qi "error"; then
  echo "User $USERNAME may already exist. Proceeding to login..."
fi

# LOGIN: Obtain a session token.
login_response=$(curl -s -X POST "$API_URL/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"${USERNAME}\", \"password\": \"${PASSWORD}\"}")
SESSION_TOKEN=$(echo "$login_response" | jq -r '.session_token')
if [ "$SESSION_TOKEN" == "null" ] || [ -z "$SESSION_TOKEN" ]; then
    echo "ERROR: Could not retrieve session token for $USERNAME. Exiting."
    exit 1
fi
echo "User $USERNAME logged in with token: $SESSION_TOKEN"

# Simulation settings
CYCLES=20
CLICKS_PER_CYCLE=10

for cycle in $(seq 1 $CYCLES); do
    echo "Cycle $cycle starting..."
    # Fetch recommendations
    rec_response=$(curl -s -X POST "$API_URL/api/recommendations" \
      -H "Content-Type: application/json" \
      -H "Authorization: $SESSION_TOKEN" \
      -d "{\"topics\": [], \"offset\": 0, \"limit\": 50}")
    article_ids=($(echo "$rec_response" | jq -r '.recommendations[].url_id'))
    num_articles=${#article_ids[@]}
    if [ $num_articles -eq 0 ]; then
        echo "No recommendations returned in cycle $cycle, skipping clicks."
    else
        echo "Cycle $cycle: Found $num_articles articles."
        for click in $(seq 1 $CLICKS_PER_CYCLE); do
            rand_index=$(( RANDOM % num_articles ))
            chosen_article="${article_ids[$rand_index]}"
            echo "Cycle $cycle: Clicking on article ID: $chosen_article"
            curl -s -X POST "$API_URL/api/interactions" \
              -H "Content-Type: application/json" \
              -H "Authorization: $SESSION_TOKEN" \
              -d "{\"interaction_type\": \"click\", \"url_id\": \"${chosen_article}\"}" > /dev/null
            sleep 0.2
        done
    fi
    echo "Cycle $cycle completed."
    sleep 1
done

echo "Simulation for user $USERNAME completed." 
