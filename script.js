let globalData = {};
let fullDetails = [];
let sortedDays = [];

// 🔹 Konwersja daty do formatu "DD.MM" (do wyświetlania)
function formatDateDisplay(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}`;
}

// 🔹 Sprawdzanie, czy data jest dzisiejsza lub przyszła (działa na "YYYY-MM-DD")
function isFutureOrToday(dateStr) {
  const today = new Date();
  const inputDate = new Date(dateStr);
  return inputDate >= today;
}

// 🔹 Renderowanie tabeli z poprawnym kolorowaniem komórek
function renderTable(limit = 3) {
  let days = [...sortedDays];
  if (limit !== 'all') days = days.slice(0, limit);

  let dayTotals = {};
  days.forEach(day => dayTotals[day] = 0);

  let html = '<table><thead><tr><th>Przedmiot</th>';
  days.forEach(day => html += `<th>${formatDateDisplay(day)}</th>`);
  html += '</tr></thead><tbody>';

  for (let subj in globalData) {
    html += `<tr><td>${subj}</td>`;
    days.forEach(day => {
      const count = globalData[subj][day] || 0;
      dayTotals[day] += count;

      // 🔹 Poprawione kolorowanie komórek
      let colorClass = '';
      if (count === 1) colorClass = 'green';
      else if (count === 2) colorClass = 'orange';
      else if (count >= 3) colorClass = 'red';

      const isExam = fullDetails.some(row => row['przedmiot'] === subj && row['dzień'] === day && row['typ'] === 'EGZ');
      const extraClass = isExam ? 'blink-red' : '';

      html += `<td class="${colorClass} ${extraClass}" onclick="showDetails('${subj}', '${day}')">${count}</td>`;
    });
    html += '</tr>';
  }

  html += '<tr><th>Razem</th>';
  days.forEach(day => {
    const total = dayTotals[day];
    let totalColorClass = total < 2 ? 'green' : total <= 4 ? 'orange' : 'red';

    html += `<th class="${totalColorClass}" onclick="showDayDetails('${day}')" style="cursor:pointer;">${total}</th>`;
  });
  html += '</tr></tbody></table>';
  
  document.getElementById('output').innerHTML = html;
}

// 🔹 Wyświetlanie szczegółów zajęć
function showDetails(subject, day) {
  const filtered = fullDetails.filter(row => row['przedmiot'] === subject && row['dzień'] === day);
  localStorage.setItem('details', JSON.stringify(filtered));
  window.location.href = 'details.html';
}

// 🔹 Przetwarzanie pliku Excel i konwersja na JSON
function processExcel(json) {
  globalData = {};
  let daySet = new Set();

  json.forEach(row => {
    const subject = row['przedmiot'];
    let day = row['dzień'];
    if (!subject || !day) return;

    // 🔹 Konwersja "DD.MM" → "YYYY-MM-DD"
    if (day.includes('.')) {
      const [d, m] = day.split('.').map(Number);
      const year = new Date().getFullYear();
      day = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    if (!isFutureOrToday(day)) return;
    if (!globalData[subject]) globalData[subject] = {};
    if (!globalData[subject][day]) globalData[subject][day] = 0;
    globalData[subject][day] += 1;
    daySet.add(day);
    row['dzień'] = day;
  });

  // 🔹 Sortowanie dat
  sortedDays = Array.from(daySet).sort((a, b) => new Date(a) - new Date(b));

  renderTable();
}

// 🔹 Czyszczenie danych z localStorage
function clearData() {
  localStorage.removeItem('excelData');
  location.reload();
}

// 🔹 Obsługa wgrywania pliku Excel
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', e => {
  const reader = new FileReader();
  reader.onload = e => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);
    fullDetails = json;
    localStorage.setItem('excelData', JSON.stringify(json));
    processExcel(json);
  };
  reader.readAsArrayBuffer(e.target.files[0]);
});

// 🔹 Wczytywanie zapisanych danych przy starcie strony
window.onload = () => {
  const saved = localStorage.getItem('excelData');
  if (saved) {
    const json = JSON.parse(saved);
    fullDetails = json;
    processExcel(json);
  }
};

// 🔹 Obsługa wyboru liczby dni w ustawieniach
const daysSelect = document.getElementById('daysSelect');
daysSelect.addEventListener('change', function() {
  const value = this.value === 'all' ? 'all' : parseInt(this.value);
  renderTable(value);
});

// 🔹 Obsługa okna modalnego
const modal = document.getElementById("settingsModal");
const btn = document.getElementById("settingsBtn");
const span = document.getElementsByClassName("close")[0];

btn.onclick = () => modal.style.display = "block";
span.onclick = () => modal.style.display = "none";
window.onclick = (event) => { if (event.target === modal) modal.style.display = "none"; };
