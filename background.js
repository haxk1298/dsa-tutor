console.log("DSA Tutor background service worker loaded");

chrome.runtime.onInstalled.addListener(() => {
    console.log("DSA Tutor extension installed");
});