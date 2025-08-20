// ==UserScript==
// @name         LinkedIn Auto-Liker v2
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  More human-like liking of LinkedIn posts with "AI" or "Agents". Adds delays to avoid detection.
// @author       Your Name
// @match        https://www.linkedin.com/feed/
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration ---
    // These are the keywords we're looking for in a post.
    const keywords = ['ai', 'agents'];

    // --- Safety Delays (in milliseconds) ---
    // How long to wait before clicking "Like" to pretend we're reading.
    const MIN_READING_DELAY = 2000; // 2 seconds
    const MAX_READING_DELAY = 5000; // 5 seconds

    // How long to wait *after* liking a post before we can like another one.
    // THIS IS THE MOST IMPORTANT SETTING TO AVOID GETTING BLOCKED.
    const MIN_COOLDOWN_DELAY = 30000; // 30 seconds
    const MAX_COOLDOWN_DELAY = 90000; // 90 seconds (1.5 minutes)


    // A queue to hold the posts we want to like.
    const likeQueue = [];
    // A flag to make sure we only process one "like" at a time.
    let isCurrentlyLiking = false;

    // A helper function to create a random delay.
    const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

    // This function processes the queue of posts to be liked, one by one.
    const processLikeQueue = async () => {
        // If the script is already in the middle of liking something, or the queue is empty, do nothing.
        if (isCurrentlyLiking || likeQueue.length === 0) {
            return;
        }

        isCurrentlyLiking = true; // Set the flag so this function doesn't run again until it's done.

        // Keep going as long as there are posts in our queue.
        while (likeQueue.length > 0) {
            const likeButton = likeQueue.shift(); // Get the next "Like" button from the list.

            // 1. Wait for a short "reading" period.
            const readingTime = randomDelay(MIN_READING_DELAY, MAX_READING_DELAY);
            console.log(`Found a post. Simulating reading for ${readingTime / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, readingTime));

            // 2. Click the "Like" button.
            likeButton.click();
            console.log('Post Liked!');

            // 3. Wait for the longer "cooldown" period.
            if (likeQueue.length > 0) {
                // Only cool down if there are more items to like.
                const cooldownTime = randomDelay(MIN_COOLDOWN_DELAY, MAX_COOLDOWN_DELAY);
                console.log(`Cooldown initiated. Waiting for ${cooldownTime / 1000} seconds before next like.`);
                await new Promise(resolve => setTimeout(resolve, cooldownTime));
            }
        }

        isCurrentlyLiking = false; // Reset the flag now that the queue is empty.
    };

    // This function checks a single post to see if it should be added to our "like" queue.
    const findPostsToLike = (post) => {
        // First, check if we've already looked at this post. If so, ignore it.
        if (post.dataset.autoLikerProcessed) {
            return;
        }
        // Mark this post as "processed" so we don't check it again.
        post.dataset.autoLikerProcessed = 'true';

        const textElement = post.querySelector('div.update-components-text');
        if (!textElement) {
            return;
        }

        const postText = textElement.innerText.toLowerCase();
        const hasKeyword = keywords.some(keyword => postText.includes(keyword));

        if (hasKeyword) {
            const likeButton = post.querySelector('button.react-button__trigger[aria-pressed="false"]');
            if (likeButton) {
                // Instead of clicking right away, add the button to our queue.
                console.log('Found a post with keywords. Adding to the like queue.');
                likeQueue.push(likeButton);
            }
        }
    };

    // Set up an observer to watch for new posts being added to the page as you scroll.
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                // Find all unprocessed posts that were just added to the page.
                const newPosts = document.querySelectorAll('div.feed-shared-update-v2:not([data-auto-liker-processed])');
                newPosts.forEach(post => findPostsToLike(post));

                // After checking for new posts, try to process the queue.
                processLikeQueue();
            }
        }
    });

    // Start watching the entire page for changes.
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Run once at the start for any posts that are already loaded.
    const initialPosts = document.querySelectorAll('div.feed-shared-update-v2:not([data-auto-liker-processed])');
    initialPosts.forEach(post => findPostsToLike(post));
    processLikeQueue();

})();
