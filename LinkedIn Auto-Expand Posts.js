// ==UserScript==
// @name         LinkedIn Auto-Expand Posts
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Automatically clicks the "...more" button on LinkedIn posts to expand them in the feed.
// @author       Gemini
// @match        https://www.linkedin.com/feed/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // This function finds and clicks the "see more" buttons.
    const expandPosts = () => {
        // LinkedIn's class names can change. This selector now includes a more specific
        // class found in your HTML example, which doesn't rely on the 'aria-expanded' attribute.
        // This makes it more robust.
        const seeMoreButtons = document.querySelectorAll(
            'button.feed-shared-inline-show-more-text__dynamic-more-text, ' + // Specific class from user feedback
            'button.line-clamp-show-more-button[aria-expanded="false"], ' + // For other post types
            'button.feed-shared-inline-show-more-text__see-more-less-toggle[aria-expanded="false"]' // Original selector as a fallback
        );


        if (seeMoreButtons.length > 0) {
            // console.log(`Found ${seeMoreButtons.length} collapsed posts. Expanding...`);
            seeMoreButtons.forEach(button => {
                // We simulate a click on each button to expand the post content.
                button.click();
            });
        }
    };

    // Since LinkedIn is a single-page application and content loads as you scroll,
    // we need to run our function periodically to catch new posts.
    // We'll check for new buttons every 2 seconds.
    const intervalId = setInterval(expandPosts, 2000);

    // Optional: It's good practice to clean up when the user navigates away.
    // This is a simple way to stop the interval if the window is closed.
    window.addEventListener('beforeunload', () => {
        clearInterval(intervalId);
    });

    // We also use a MutationObserver to run the function immediately when
    // new content is added to the feed, making it feel more responsive.
    const observer = new MutationObserver((mutationsList, observer) => {
        // A small delay can help ensure all elements are ready before we try to expand them.
        setTimeout(() => {
            for(const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // New nodes were added, let's check for "see more" buttons.
                    expandPosts();
                }
            }
        }, 500);
    });

    // Start observing the main feed container for changes.
    // We need to wait for the feed to exist before observing it.
    const startObserver = () => {
        const feedElement = document.querySelector('main');
        if (feedElement) {
            observer.observe(feedElement, { childList: true, subtree: true });
        } else {
            // If the feed isn't there yet, try again in a moment.
            setTimeout(startObserver, 500);
        }
    };

    startObserver();

})();
