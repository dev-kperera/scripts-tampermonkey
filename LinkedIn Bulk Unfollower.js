// ==UserScript==
// @name         LinkedIn Bulk Unfollower
// @namespace    http://tampermonkey.net/
// @version      2025.08.22
// @description  Adds a menu command to unfollow everyone on your LinkedIn "Following" page. Use at your own risk.
// @author       Kushan Perera
// @match        https://www.linkedin.com/mynetwork/network-manager/people-follow/following/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linkedin.com
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // --- Script State and Configuration ---

    // A simple switch to tell the script if it should be running or not.
    let isRunning = false;

    // Track the last scroll height to know if new content has been loaded.
    let lastScrollHeight = 0;

    // Initial delay settings. These will adjust automatically.
    let modalDelay = 500;    // Time to wait for the confirmation pop-up
    let unfollowDelay = 100; // Time to wait after clicking "Unfollow"
    let scrollDelay = 1000;  // Time to wait after scrolling down

    // --- Core Functions ---

    /**
     * Waits for an element to appear on the page before timing out.
     * Think of it like waiting for a friend who might be late.
     */
    function waitForElement(selector, maxTimeMs) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const element = document.querySelector(selector);
                const elapsedTime = Date.now() - startTime;

                if (element) {
                    clearInterval(interval);
                    resolve(element);
                } else if (elapsedTime >= maxTimeMs) {
                    clearInterval(interval);
                    resolve(null); // Didn't find it in time
                }
            }, 100); // Check every 100 milliseconds
        });
    }

    /**
     * The main function that finds and clicks the "Following" buttons.
     */
    async function unfollowVisibleUsers() {
        if (!isRunning) {
            console.log("🛑 Process stopped by user.");
            return;
        }

        console.log("🔎 Looking for 'Following' buttons...");
        const followButtons = document.querySelectorAll(".artdeco-button__text");
        const followingButtons = Array.from(followButtons).filter(button => button.innerText.trim() === "Following");

        if (followingButtons.length === 0) {
            console.log("No 'Following' buttons found on screen. Checking if we need to scroll...");
            checkIfDoneOrScroll();
            return;
        }

        console.log(`👤 Found ${followingButtons.length} people to unfollow on the current screen.`);
        for (const button of followingButtons) {
            if (!isRunning) break; // Stop if the user cancelled during the loop

            button.click();
            const success = await waitForModalAndUnfollow();
            adjustDelays(success);
            await new Promise(resolve => setTimeout(resolve, unfollowDelay)); // Wait a bit before the next one
        }

        // After trying to unfollow everyone on screen, scroll to load more.
        if (isRunning) {
            setTimeout(scrollDown, scrollDelay);
        }
    }

    /**
     * Handles the confirmation pop-up (modal).
     */
    async function waitForModalAndUnfollow() {
        const modal = await waitForElement(".artdeco-modal__content", modalDelay);

        if (modal) {
            // Find the primary button in the modal's action bar, which should be the final "Unfollow" confirmation
            const unfollowButton = modal.querySelector(".artdeco-modal__actionbar .artdeco-button--primary");
            if (unfollowButton) {
                unfollowButton.click();
                console.log("✅ Unfollowed one person.");
                return true; // Success!
            }
        }
        console.warn("⚠️ Could not find the unfollow confirmation pop-up in time. Speeding up might be causing issues.");
        return false; // Failure
    }

    /**
     * Checks if we've reached the bottom of the page or if we need to keep scrolling.
     */
    function checkIfDoneOrScroll() {
        if (!isRunning) return;

        const currentScrollHeight = document.body.scrollHeight;
        if (currentScrollHeight > lastScrollHeight) {
            // The page got longer, so new people were loaded.
            lastScrollHeight = currentScrollHeight;
            scrollDown();
        } else {
            // Scrolled to the bottom, but the page height didn't change.
            // This means we probably reached the end of the list.
            console.log("✨ Reached the end of the list! All done.");
            isRunning = false; // Stop the script
        }
    }

    /**
     * Scrolls the page down to load more content.
     */
    function scrollDown() {
        if (!isRunning) return;
        console.log("⏬ Scrolling down to load more people...");
        window.scrollTo(0, document.body.scrollHeight);
        // After scrolling, wait a moment for new people to load, then start unfollowing again.
        setTimeout(unfollowVisibleUsers, scrollDelay);
    }

    /**
     * Speeds up or slows down the script based on how well it's working.
     * If things are working smoothly, it goes faster. If it hits a snag, it slows down.
     */
    function adjustDelays(success) {
        const minModalDelay = 200, maxModalDelay = 1000;
        const minUnfollowDelay = 50, maxUnfollowDelay = 500;
        const minScrollDelay = 500, maxScrollDelay = 2000;

        if (success) {
            // Speed up
            modalDelay = Math.max(modalDelay - 50, minModalDelay);
            unfollowDelay = Math.max(unfollowDelay - 25, minUnfollowDelay);
        } else {
            // Slow down
            modalDelay = Math.min(modalDelay + 100, maxModalDelay);
            unfollowDelay = Math.min(unfollowDelay + 50, maxUnfollowDelay);
        }
    }


    // --- Menu Commands ---

    function startScript() {
        if (isRunning) {
            alert("The unfollow script is already running.");
            return;
        }
        console.clear();
        console.log("🚀 Starting LinkedIn unfollow script! Go to the Tampermonkey menu to stop it.");
        alert("Starting the LinkedIn unfollow script. It will now begin unfollowing people on this page.");
        isRunning = true;
        lastScrollHeight = 0; // Reset scroll height
        scrollDown(); // Kick off the process
    }

    function stopScript() {
        if (!isRunning) {
            alert("The unfollow script is not currently running.");
            return;
        }
        console.log("🛑 Script will stop after the current action. Please wait a moment.");
        alert("Stopping the unfollow script.");
        isRunning = false;
    }

    GM_registerMenuCommand("▶️ Start Unfollowing Everyone", startScript);
    GM_registerMenuCommand("⏹️ Stop Unfollowing", stopScript);

    console.log("✅ LinkedIn Unfollower script loaded. Open the Tampermonkey menu to start.");

})();
