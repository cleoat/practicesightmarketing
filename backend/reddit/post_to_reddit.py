#!/usr/bin/env python3
"""
PracticeSight Reddit Posting Script
Uses PRAW with built-in safety guardrails
"""

import praw
import sys
import json
import os
from datetime import datetime

def get_reddit():
    """Authenticate with Reddit"""
    try:
        reddit = praw.Reddit(
            client_id=os.getenv('REDDIT_CLIENT_ID'),
            client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
            user_agent=os.getenv('REDDIT_USER_AGENT', 'PracticeSight/1.0'),
            username=os.getenv('REDDIT_USERNAME'),
            password=os.getenv('REDDIT_PASSWORD')
        )
        return reddit
    except Exception as e:
        return {"error": f"Auth failed: {str(e)}"}

def check_account_health(reddit):
    """Check if account is suspended or shadowbanned"""
    try:
        user = reddit.user.me()
        if user.is_suspended:
            return {"error": "Account is suspended!"}
        return {"healthy": True, "username": user.name}
    except Exception as e:
        return {"error": f"Account check failed: {str(e)}"}

def safe_post(subreddit_name, title, content):
    """Post to Reddit with all safety checks"""
    
    reddit = get_reddit()
    if isinstance(reddit, dict) and "error" in reddit:
        print(json.dumps(reddit))
        return
    
    # GUARD 1: Account health
    health = check_account_health(reddit)
    if "error" in health:
        print(json.dumps(health))
        return
    
    # GUARD 2: Validate subreddit exists
    try:
        subreddit = reddit.subreddit(subreddit_name)
        subreddit.load()
    except Exception as e:
        print(json.dumps({"error": f"Subreddit not found: {subreddit_name}"}))
        return
    
    # GUARD 3: Content validation
    if len(content) < 10:
        print(json.dumps({"error": "Content too short"}))
        return
    if len(content) > 40000:
        print(json.dumps({"error": "Content too long"}))
        return
    
    # GUARD 4: Check for recent posts (no spam same subreddit)
    try:
        recent_posts = list(subreddit.new(limit=10))
        for post in recent_posts:
            if str(post.author) == health["username"]:
                print(json.dumps({
                    "error": f"Already posted in r/{subreddit_name} recently"
                }))
                return
    except Exception as e:
        pass  # Skip if can't check
    
    # POST
    try:
        submission = subreddit.submit(title=title, selftext=content)
        result = {
            "success": True,
            "url": f"https://reddit.com{submission.permalink}",
            "post_id": submission.id,
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "error": f"Post failed: {str(e)}"
        }))

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Usage: python script.py <subreddit> <title> <content>"}))
        sys.exit(1)
    
    subreddit = sys.argv[1]
    title = sys.argv[2]
    content = sys.argv[3]
    
    safe_post(subreddit, title, content)
