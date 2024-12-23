const searchForm = document.getElementById("searchForm");
const searchQuery = document.getElementById("searchQuery");
const resultsTable = document.getElementById("resultsTable");
const exportButton = document.getElementById("exportButton");
const tableBody = resultsTable.querySelector("tbody");

const API_KEY = "AIzaSyASQTZeAMwDZSVLR9u3Yjis-3xl_Kpo5-s";
const CX = "b025e4ddfe79b49eb";

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = searchQuery.value.trim();
  if (!query) return alert("Please enter a search query.");

  const results = await fetchGoogleResults(query);
  if (results.length > 0) {
    populateTable(results);
    resultsTable.classList.remove("hidden");
    exportButton.classList.remove("hidden");
  }
});

async function fetchGoogleResults(query) {
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
    query
  )}&key=${API_KEY}&cx=${CX}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    return data.items.map((item) => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
    }));
  } catch (error) {
    console.error("Error fetching search results:", error);
    return [];
  }
}

function populateTable(results) {
  tableBody.innerHTML = "";
  results.forEach((result) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="border px-4 py-2">${result.title}</td>
      <td class="border px-4 py-2">${result.snippet}</td>
      <td class="border px-4 py-2"><a href="${result.link}" target="_blank" class="text-blue-500">Visit</a></td>
    `;
    tableBody.appendChild(row);
  });
}

exportButton.addEventListener("click", () => {
  const rows = Array.from(tableBody.querySelectorAll("tr")).map((row) =>
    Array.from(row.querySelectorAll("td")).map(
      (cell) => cell.innerText || cell.textContent
    )
  );
  const csvContent =
    "data:text/csv;charset=utf-8," +
    rows.map((row) => row.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "search_results.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
