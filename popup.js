let remainingAttempts = 0;
let maxAttempts = 20;
updateRemainingAttempts();

document.getElementById("summarizeButton").addEventListener("click", async () => {
    const inputText = document.getElementById("inputText").value;
    if (inputText) {
        const summary = await getSummary(inputText);
        document.getElementById("summaryText").textContent = summary;
        document.getElementById("remainingAttempts").textContent = `Remaining attempts: ${remainingAttempts} out of ${maxAttempts} free per day.`;
    }
});

async function getSummary(text) {
    return new Promise((resolve, reject) => {
        const port = chrome.runtime.connect({ name: "summary" });
        port.postMessage({ action: "summarize", text });
        port.onMessage.addListener((response) => {
            if (response.statusCode === 200) {
                remainingAttempts += 1;
            }
            // console.log("response status: " + response.statusCode);
            // console.log("Summary: " + response.summary);;
            resolve(response.summary);
        });
    });
}

async function updateRemainingAttempts() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "getRemainingAttempts" }, (response) => {
            if (response.remainingAttempts !== null) {
                remainingAttempts = response.remainingAttempts;
                document.getElementById("remainingAttempts").textContent = `Remaining attempts: ${response.remainingAttempts} out of ${maxAttempts} free per day.`;
            } else {
                document.getElementById("remainingAttempts").textContent = "Error fetching remaining attempts";
            }
            resolve();
        });
    });
}

document.getElementById("apiVersion").addEventListener("change", async (event) => {
    const selectedVersion = event.target.value;
    chrome.storage.local.set({ "selectedVersion": selectedVersion });
});

// Set the initial value of the select element based on the stored value
chrome.storage.local.get(["selectedVersion"], (result) => {
    document.getElementById("apiVersion").value = result.selectedVersion || "GPT3";
});
