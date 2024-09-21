document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById('submit-btn');
  const inputTextElem = document.getElementById('input-text');
  const summaryTextElem = document.getElementById('summary-text');
  const summaryHistoryElem = document.getElementById('summary-history');
  
  // Dropdowns for language selection
  const dropdowns = document.querySelectorAll(".dropdown-container"),
      inputLanguageDropdown = document.querySelector("#input-language"),
      outputLanguageDropdown = document.querySelector("#output-language");
  
  // Define languages
//   const languages = [
//       { name: "English", native: "English", code: "en" },
//       { name: "Spanish", native: "Español", code: "es" },
//       // Add more languages as needed
//   ];
  
  function populateDropdown(dropdown, options) {
      dropdown.querySelector("ul").innerHTML = "";
      options.forEach((option) => {
          const li = document.createElement("li");
          const title = option.name + " (" + option.native + ")";
          li.innerHTML = title;
          li.dataset.value = option.code;
          li.classList.add("option");
          dropdown.querySelector("ul").appendChild(li);
      });
  }
  
  populateDropdown(inputLanguageDropdown, languages);
  populateDropdown(outputLanguageDropdown, languages);
  
  dropdowns.forEach((dropdown) => {
      dropdown.addEventListener("click", () => {
          dropdown.classList.toggle("active");
      });
  
      dropdown.querySelectorAll(".option").forEach((item) => {
          item.addEventListener("click", () => {
              dropdown.querySelectorAll(".option").forEach((item) => {
                  item.classList.remove("active");
              });
              item.classList.add("active");
              const selected = dropdown.querySelector(".selected");
              selected.innerHTML = item.innerHTML;
              selected.dataset.value = item.dataset.value;
              translate();
          });
      });
  });
  
  document.addEventListener("click", (e) => {
      dropdowns.forEach((dropdown) => {
          if (!dropdown.contains(e.target)) {
              dropdown.classList.remove("active");
          }
      });
  });
  
  const swapBtn = document.querySelector(".swap-position"),
      inputLanguage = inputLanguageDropdown.querySelector(".selected"),
      outputLanguage = outputLanguageDropdown.querySelector(".selected"),
      outputTextElem = document.querySelector("#output-text");
  
  swapBtn.addEventListener("click", () => {
      const temp = inputLanguage.innerHTML;
      inputLanguage.innerHTML = outputLanguage.innerHTML;
      outputLanguage.innerHTML = temp;
  
      const tempValue = inputLanguage.dataset.value;
      inputLanguage.dataset.value = outputLanguage.dataset.value;
      outputLanguage.dataset.value = tempValue;
  
      const tempInputText = inputTextElem.value;
      inputTextElem.value = outputTextElem.value;
      outputTextElem.value = tempInputText;
  
      translate();
  });
  
  async function translate() {
      const inputText = inputTextElem.value.trim();
      const inputLanguage = inputLanguageDropdown.querySelector(".selected").dataset.value;
      const outputLanguage = outputLanguageDropdown.querySelector(".selected").dataset.value;
  
      if (!inputText) {
          outputTextElem.value = "";
          summaryTextElem.innerHTML = "";
          return;
      }
  
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${inputLanguage}&tl=${outputLanguage}&dt=t&q=${encodeURIComponent(inputText)}`;
  
      try {
          const response = await fetch(url);
          const json = await response.json();
          const translatedText = json[0].map((item) => item[0]).join("");
  
          outputTextElem.value = translatedText;
  
          // Remove summarization if not needed
          // const summary = await summarizeText(translatedText);
          // summaryTextElem.innerHTML = summary;
      } catch (error) {
          console.error("Translation error:", error);
          summaryTextElem.innerHTML = "Error summarizing text.";
      }
  }
  
  inputTextElem.addEventListener("input", () => {
      translate();
  });
  
  const uploadDocument = document.querySelector("#upload-document"),
      uploadTitle = document.querySelector("#upload-title");
  
  uploadDocument.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file.type === "application/pdf" || file.type === "text/plain") {
          uploadTitle.innerHTML = file.name;
          if (file.type === "application/pdf") {
              const reader = new FileReader();
              reader.readAsArrayBuffer(file);
              reader.onload = () => {
                  const typedarray = new Uint8Array(reader.result);
                  pdfjsLib.getDocument(typedarray).promise.then((pdf) => {
                      let allText = "";
                      const numPages = pdf.numPages;
                      const pagesPromises = [];
  
                      for (let i = 1; i <= numPages; i++) {
                          pagesPromises.push(
                              pdf.getPage(i).then((page) => {
                                  return page.getTextContent().then((textContent) => {
                                      const pageText = textContent.items.map(item => item.str).join(' ');
                                      allText += pageText + " ";
                                  });
                              })
                          );
                      }
  
                      Promise.all(pagesPromises).then(() => {
                          inputTextElem.value = allText.trim();
                          translate();
                      });
                  });
              };
          } else if (file.type === "text/plain") {
              const reader = new FileReader();
              reader.readAsText(file);
              reader.onload = (e) => {
                  inputTextElem.value = e.target.result;
                  translate();
              };
          }
      } else {
          alert("Please upload a valid PDF or TXT file.");
      }
  });
  
  const downloadBtn = document.querySelector("#download-btn");
  
  downloadBtn.addEventListener("click", () => {
      const outputText = outputTextElem.value;
      const outputLanguage = outputLanguageDropdown.querySelector(".selected").dataset.value;
      if (outputText) {
          const blob = new Blob([outputText], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.download = `translated-to-${outputLanguage}.txt`;
          a.href = url;
          a.click();
      }
  });
  
  const inputChars = document.querySelector("#input-chars");
  
  inputTextElem.addEventListener("input", () => {
      inputChars.innerHTML = inputTextElem.value.length;
  });
  
  // Initialize local storage fetch
  fetchLocalStorage();

  // Function to handle deletion of summaries
  window.handleDelete = function (txt) {
      const summaryData = JSON.parse(localStorage.getItem("summary")) || [];
      const filtered = summaryData.filter(d => d !== txt);
      localStorage.setItem("summary", JSON.stringify(filtered));
      fetchLocalStorage();
  };

  // Function to fetch summaries from local storage
  async function fetchLocalStorage() {
      const result = localStorage.getItem("summary");
      const data = JSON.parse(result)?.reverse() || [];
      summaryHistoryElem.innerHTML = data.map(d => `
          <div class="summary-item">
              <p>${d}</p>
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAdYB3l8Z7MAAAAABJRU5ErkJggg==" alt="Delete" onclick="handleDelete('${d}')">
          </div>
      `).join('');
  }
});
