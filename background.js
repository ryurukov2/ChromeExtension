chrome.runtime.onConnect.addListener(async (port) => {
    port.onMessage.addListener(async (message) => {
        if (message.action === "summarize") {
            console.log("Trying");
            try {
                const accountId = await getAccountId();
                console.log(typeof (accountId));
                console.log(accountId);
                const response = await fetchSummaryLocal(message.text, accountId);
                console.log(response.status);
                port.postMessage({ summary: response.response_data, statusCode: response.status });
            } catch (error) {
                port.postMessage({ error });
            }
        }
    });
});

async function getAccountId() {
    console.log('From getAccountId');
    try {
        const userInfo = await chrome.identity.getProfileUserInfo();
        return userInfo.id;
    } catch (error) {
        console.error('Error fetching account ID:', error);
        return null;
    }
}

async function fetchSummaryLocal(text, accountId) {
    // const response = await fetch('https://budgethelper.click/api/submit-text/', {
        const response = await fetch('http://localhost:81/api/submit-text/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',

        },
        body: JSON.stringify({
            input_text: text,
            account_id: accountId
        }),
    });
    console.log(`response status is ${response.status}`);
    const data = await response.json();
    // console.log(data);
    return { response_data: data.response_data, status: response.status };
}

async function checkDailyUsage(accountId) {
    // const response = await fetch('https://budgethelper.click/api/check-daily-usage/', {
        const response = await fetch('http://localhost:81/api/check-daily-usage/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            account_id: accountId,
        }),
    });

    const data = await response.json();
    // console.log('Daily usage:', data.response_data);
    return data.response_data;
}

async function onExtensionEvent() {
    // console.log('from onExtensionEvent');
    const accountId = await getAccountId();
    if (accountId) {
        checkDailyUsage(accountId);
    }
}



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "getRemainingAttempts") {
        (async () => {
            const accountId = await getAccountId();
            if (accountId) {
                const remainingAttempts = await checkDailyUsage(accountId);
                sendResponse({ remainingAttempts });
            } else {
                sendResponse({ remainingAttempts: null });
            }
        })();
    }
    return true; // Keep the message channel open for the async operation
});
