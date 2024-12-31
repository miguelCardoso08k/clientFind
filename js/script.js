const searchForm = document.getElementById("searchForm");
const searchQuery = document.getElementById("searchQuery");
const resultsTable = document.getElementById("resultsTable");
const exportButton = document.getElementById("exportButton");
const tableBody = resultsTable.querySelector("tbody");
const resultsContainer = document.getElementById("resultsContainer");

const API_KEY = "AIzaSyASQTZeAMwDZSVLR9u3Yjis-3xl_Kpo5-s";
const CX = "b025e4ddfe79b49eb";

let allResults = [];
let currentPage = 1;
const resultsPerPage = 10;

const renderPagination = () => {
  const paginationContainer = document.getElementById("pagination");
  if (paginationContainer) paginationContainer.remove();

  const totalPages = Math.ceil(allResults.length / resultsPerPage);
  if (totalPages <= 1) return;

  const pagination = document.createElement("div");
  pagination.id = "pagination";
  pagination.className = "mt-4 flex justify-center gap-2";

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.className =
      "px-3 py-1 border rounded hover:bg-gray-200" +
      (i === currentPage ? "bg-blue-500 text-white" : "");

    button.addEventListener("click", () => {
      currentPage = i;
      populateTable();
    });
    pagination.appendChild(button);
  }

  resultsContainer.appendChild(pagination);
};

const fetchGoogleResults = async (query, startIndex = 1) => {
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
    query
  )}&key=${API_KEY}&cx=${CX}&start=${startIndex}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.items.map((item) => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
    }));
  } catch (error) {
    console.error("Error fetching search results:", error);
    return [];
  }
};

const fetchAllGoogleResults = async (query) => {
  let allResults = [];
  let startIndex = 1;

  while (startIndex <= 100) {
    const results = await fetchGoogleResults(query, startIndex);

    if (results.length === 0) break;

    console.log(allResults);
    allResults = [...allResults, ...results];
    console.log(allResults);
    startIndex += 10;
  }

  return allResults;
};

const extractAddress = (text) => {
  const addressKeywords = [
    "Rua",
    "Av",
    "Bairro",
    "Jd",
    "Avenida",
    "Rod",
    "Rodovia",
    "Est",
    "Estrada",
    "CEP",
  ];
  const sentences = text.split(/\.|\n/);
  const address = sentences.find((sentence) =>
    addressKeywords.some((keyword) => sentence.includes(keyword))
  );
  return address || null;
};

const extractPhone = (text) => {
  const phoneRegex = /\(?\d{2,3}\)?[\s-]?\d{4,5}[\s-]?\d{4}/g;
  const match = text.match(phoneRegex);
  return match ? match[0] : null;
};

const populateTable = () => {
  tableBody.innerHTML = "";
  const startIndex = (currentPage - 1) * resultsPerPage;
  const paginatedResults = allResults.slice(
    startIndex,
    startIndex + resultsPerPage
  );

  paginatedResults.forEach((result) => {
    const phone = extractPhone(result.snippet);
    const address = extractAddress(result.snippet);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="border px-4 py-2">${result.title}</td>
      <td class="border px-4 py-2">${result.snippet}</td>
      <td class="border px-4 py-2">${phone || ""}</td>
      <td class="border px-4 py-2">${address || ""}</td>
      <td class="border px-4 py-2"><a href="${
        result.link
      }" target="_blank" class="text-blue-500">Visit</a></td>
    `;
    tableBody.appendChild(row);
  });
};

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = searchQuery.value.trim();
  if (!query) return alert("Por favor digite sua query de busca");

  resultsContainer.innerHTML = "<p class='text-center'>Buscando dados...</p>";
  allResults = [];
  currentPage = 1;

  const results = await fetchAllGoogleResults(query);
  if (results.length > 0) {
    allResults = results;
    resultsContainer.innerHTML = `<p class='text-center mb-4'> ${allResults.length} resultados encontrados.</p>`;
    resultsContainer.appendChild(resultsTable);
    populateTable();
    renderPagination();
    resultsTable.classList.remove("hidden");
    exportButton.classList.remove("hidden");
  } else {
    resultsContainer.innerHTML =
      "<p class = 'text-center'>Nenhum resultado encontrado.</p>";
    resultsTable.classList.add("hidden");
    exportButton.classList.add("hidden");
  }
});

exportButton.addEventListener("click", () => {
  const rows = allResults.map((result) => {
    const phone = extractPhone(result.snippet);
    const address = extractAddress(result.snippet);
    return [
      result.title,
      "",
      result.snippet,
      "",
      phone || "",
      "",
      address || "",
      "",
      result.link,
    ];
  });

  const headers = [
    "Nome",
    "",
    "Descrição",
    "",
    "Telefone",
    "",
    "Endereço",
    "",
    "Link Completo",
  ];
  const data = [headers, ...rows];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
  XLSX.writeFile(workbook, "search_results.xlsx");
});
