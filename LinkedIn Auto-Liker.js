// ==UserScript==
// @name         LinkedIn Auto-Liker
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically likes LinkedIn posts on the feed that contain "AI" or "Agents".
// @author       Kushan Perera
// @match        https://www.linkedin.com/feed/
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // These are the keywords we're looking for in a post.
    const keywords = ['ai', 'agents'];

    // This function checks a single post to see if it should be liked.
    const processPost = (post) => {
        // Find the text part of the post.
        const textElement = post.querySelector('div.update-components-text');

        // If we can't find any text, we stop.
        if (!textElement) {
            return;
        }

        const postText = textElement.innerText.toLowerCase();

        // Check if the post's text includes any of our keywords.
        const hasKeyword = keywords.some(keyword => postText.includes(keyword));

        if (hasKeyword) {
            // Find the "Like" button, but only if it hasn't been clicked yet.
            // The 'aria-pressed="false"' part is key to not un-liking things.
            const likeButton = post.querySelector('button.react-button__trigger[aria-pressed="false"]');

            if (likeButton) {
                console.log('Found a post with keywords! Liking it...');
                // Click the button!
                likeButton.click();
            }
        }
    };

    // This function finds all posts currently on the page and processes them.
    const findAndProcessPosts = () => {
        // LinkedIn posts are usually inside elements with this class.
        const posts = document.querySelectorAll('div.feed-shared-update-v2');
        posts.forEach(post => {
            // Check each post one by one.
            processPost(post);
        });
    };

    // Since LinkedIn loads new posts as you scroll, we need something
    // that watches for changes on the page. MutationObserver is perfect for this.
    const observer = new MutationObserver((mutations) => {
        // When something on the page changes, we run our check again.
        findAndProcessPosts();
    });

    // Start the observer. We tell it to watch the main body of the page
    // for new things being added or removed.
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // We also run the check once right when the script starts,
    // just in case some posts are already loaded.
    findAndProcessPosts();

})();
