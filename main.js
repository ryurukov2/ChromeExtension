const inputText = document.getElementById("inputText");
const summarizeButton = document.getElementById("summarizeButton");

inputText.addEventListener("input", function() {
    const inputLength = inputText.value.length;
    if (inputLength >= 200) {
      summarizeButton.removeAttribute("disabled");
    } else {
      summarizeButton.setAttribute("disabled", "");
    }
  });