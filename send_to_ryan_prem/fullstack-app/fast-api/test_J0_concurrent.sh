#!/bin/bash
# test_explore_exploit.sh
#
# This script simulates explore-exploit behavior by creating 50 users (test_EE_1 ... test_EE_50)
# assigned to the J2 office. Each user logs in and then, in 10 refresh cycles, fetches unfiltered
# recommendations and randomly clicks on 10 articles per cycle.
#
# The repeated clicks and refreshes should drive the MAB algorithm to re-rank articles,
# which will be reflected in the bar chart showing article rankings and click-through rates.
#
# Requirements:
#   - curl
#   - jq (for JSON parsing)



#API_URL="https://recsys218.usgovvirginia.cloudapp.usgovcloudapi.net"

API_URL="http://localhost:5000"
#API_URL=${API_URL:-"http://backend:5000"}
echo "Using API URL: $API_URL"

NUM_USERS=2
CYCLES=1
CLICKS_PER_CYCLE=5

echo "Starting explore-exploit simulation for $NUM_USERS users..."

# Loop over NUM_USERS and run each user simulation concurrently.
for user_index in $(seq 1 $NUM_USERS); do
    (
    username="test_EE_J0_${user_index}"
    password="password"
    office_code="J0"  # Adjust this if needed

    echo "------------------------------------------------------------"
    echo "Processing user: $username"

    # SIGNUP: Create the user. If the user already exists, we'll handle that gracefully.
    signup_response=$(curl -s -X POST "$API_URL/api/signup" \
      -H "Content-Type: application/json" \
      -d "{\"username\": \"${username}\", \"password\": \"${password}\", \"office_code\": \"${office_code}\"}")
    echo "Signup response for $username: $signup_response"

    # If signup returns an error (e.g. user exists), proceed to login.
    if echo "$signup_response" | grep -qi "error"; then
      echo "User $username may already exist. Proceeding to login..."
    fi

    # LOGIN: Obtain a session token.
    login_response=$(curl -s -X POST "$API_URL/api/login" \
      -H "Content-Type: application/json" \
      -d "{\"username\": \"${username}\", \"password\": \"${password}\"}")
    session_token=$(echo "$login_response" | jq -r '.session_token')
    if [ "$session_token" == "null" ] || [ -z "$session_token" ]; then
        echo "ERROR: Could not retrieve session token for $username. Skipping this user."
        exit 1
    fi
    echo "User $username logged in with token: $session_token"

    # Simulate refresh cycles with random clicks.
    for cycle in $(seq 1 $CYCLES); do
        echo "User $username: Refresh cycle $cycle"
        # Fetch unfiltered recommendations.
        rec_response=$(curl -s -X POST "$API_URL/api/recommendations" \
          -H "Content-Type: application/json" \
          -H "Authorization: $session_token" \
          -d "{\"topics\": [], \"offset\": 0, \"limit\": 50}")
        article_ids=($(echo "$rec_response" | jq -r '.recommendations[].url_id'))
        num_articles=${#article_ids[@]}
        echo "User $username: Cycle $cycle - Found $num_articles articles."

        if [ $num_articles -eq 0 ]; then
            echo "User $username: No articles returned in cycle $cycle; skipping clicks."
        else
            for click in $(seq 1 $CLICKS_PER_CYCLE); do
                rand_index=$(( RANDOM % num_articles ))
                chosen_article="${article_ids[$rand_index]}"
                echo "User $username: [Cycle $cycle] Click $click/$CLICKS_PER_CYCLE on article ID: $chosen_article"
                curl -s -X POST "$API_URL/api/interactions" \
                  -H "Content-Type: application/json" \
                  -H "Authorization: $session_token" \
                  -d "{\"interaction_type\": \"click\", \"url_id\": \"${chosen_article}\"}" > /dev/null
                sleep 0.1  # Short pause between clicks
            done
        fi
        sleep 1  # Pause between refresh cycles to allow for ranking updates
    done

    echo "Finished simulation for user $username."
    ) &  # Run each user simulation in the background.
done

wait
echo "Explore-exploit simulation completed for all $NUM_USERS users."
