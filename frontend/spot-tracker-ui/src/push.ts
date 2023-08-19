async function handlePush() {
    if (!supportsWebPush()) {
        return;
    }
}

handlePush();
console.log("sending push notifications");

function supportsWebPush() {
    return 'serviceworker' in navigator;
}