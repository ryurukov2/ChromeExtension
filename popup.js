let remainingAttempts = 0;
let selectedVersion = "GPT3";
let maxAttempts = 20;
const signInButton = document.getElementById("sign-in");
const signOutButton = document.getElementById("sign-out");
const attemptsInfo = document.getElementById("remainingAttempts");
const ovelayEl = document.getElementById("loginOverlay");
// const BASE_URL = "http://localhost:8000/"; 
// for local test
BASE_URL = "https://summarize.ryurukov.dev/";
updateRemainingAttempts();

signInButton.addEventListener("click", function () {
  console.log("button clicked");
  try {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
        window.open(BASE_URL + "login/", "_blank");
        return;
      }
      console.log(token);
      fetch(BASE_URL + "api/login/google/", {
        method: "POST",
        body: JSON.stringify({ token: token }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then(() => (window.location.href = "popup.html"));
    });
  } catch (err) {
    console.error(err);
  }
});

signOutButton.addEventListener("click", function () {
  try {
    fetch(BASE_URL + "google_logout/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      })
      .finally(() => {
        window.location.href = "popup.html";
      });
  } catch (err) {
    console.error(err);
  }
});

document
  .getElementById("summarizeButton")
  .addEventListener("click", async () => {
    try {
      const inputText = document.getElementById("inputText").value;
      if (inputText) {
        const summary = await getSummary(inputText);
        document.getElementById("summaryText").textContent = summary;
        document.getElementById(
          "remainingAttempts"
        ).textContent = `Remaining attempts: ${remainingAttempts} out of ${maxAttempts} free per day.`;
      }
    } catch (err) {
      console.error(err);
    }
  });

async function getSummary(text) {
  const response = await fetchSummaryLocal(text, selectedVersion);
  if (response.status === 200) {
    remainingAttempts += selectedVersion === "GPT3" ? 1 : 2;
  }
  return response.response_data || "There was an error submitting the request.";
}

async function fetchSummaryLocal(text, selectedVersion) {
  const endpoint =
    selectedVersion === "GPT3.5" ? "api/submit-text-adv/" : "api/submit-text/";
  const response = await fetch(BASE_URL + `${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_text: text,
    }),
  });
  console.log(`response status is ${response.status}`);
  const data = await response.json();
  return { response_data: data.response_data, status: response.status };
}

async function updateRemainingAttempts() {
  const response = await checkDailyUsage();

  if (response) {
    console.log(response);
    let r_data = await response.json();
    remainingAttempts = r_data.response_data;
    console.log(remainingAttempts);

    attemptsInfo.textContent = `Remaining attempts: ${remainingAttempts} out of ${maxAttempts} free per day.`;
    if (response.status === 200) {
      hideLoginOverlay();
    } else {
      // display an ovelay with a log in button
      showLoginOverlay();
    }
  } else {
    document.getElementById("remainingAttempts").textContent =
      "Error fetching remaining attempts";
  }
}
function hideLoginOverlay() {
  ovelayEl.style.display = "none";
  signInButton.style.display = "none";
  signOutButton.style.display = "inline";
  attemptsInfo.style.display = "block";
}
function showLoginOverlay() {
  ovelayEl.style.display = "flex";
  signInButton.style.display = "inline";
  signOutButton.style.display = "none";
  attemptsInfo.style.display = "none";
}

async function checkDailyUsage() {
  const response = await fetch(BASE_URL + "api/check-daily-usage/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log(`response status is ${response.status}`);

  return response;
}

document
  .getElementById("apiVersion")
  .addEventListener("change", async (event) => {
    selectedVersion = event.target.value;
    chrome.storage.local.set({ selectedVersion: selectedVersion });
  });

chrome.storage.local.get(["selectedVersion"], (result) => {
  selectedVersion = result.selectedVersion;
  document.getElementById("apiVersion").value = selectedVersion || "GPT3";
});
