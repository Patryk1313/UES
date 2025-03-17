let globalData = {};
let fullDetails = [];
let sortedDays = [];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day = ('0' + d.getDate()).slice(-2);
  const month = ('0' + (d.getMonth() + 1)).slice(-2);
  return `${day}-${month}`;
}

function isFutureOrToday(dateStr) {
  const [day, month] = dateStr.split('-').map(Number);
  const today = new Date();
  const inputDate = new Date(today.getFullYear(), month - 1, day);
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return inputDate >= now;
}

// Modyfikacja renderTable aby dodac klasy do liczb zamiast tła
function renderTable(limit = 3) {
  let days = [...sortedDays];
  if (limit !== 'all') days = days.slice(0, limit);

  let dayTotals = {};
  days.forEach(day => dayTotals[day] = 0);

  let html = '<table><thead><tr><th>Przedmiot</th>';
  days.forEach(day => html += `<th>${day}</th>`);
  html += '</tr></thead><tbody>';

  for (let subj in globalData) {
    html += `<tr><td class="subject-cell">${subj}</td>`;
    days.forEach(day => {
      const count = globalData[subj][day] || 0;
      dayTotals[day] += count;
      let numberClass = '';
      if (count === 0) numberClass = 'zero-number';
      else if (count < 2) numberClass = 'green-number';
      else if (count >= 2 && count <= 4) numberClass = 'orange-number';
      else numberClass = 'red-number';
  
      const isExam = fullDetails.some(row => row['przedmiot'] === subj && row['dzień'] === day && row['typ'] === 'EGZ');
      const extraClass = isExam ? 'blink-red' : '';
  
      html += `<td onclick="showDetails('${subj}', '${day}')">
                 <span class="${numberClass} ${extraClass}">${count}</span>
               </td>`;
    });
    html += '</tr>';
  }
  
  // Wiersz „Razem”
  html += '<tr><th>Razem</th>';
  days.forEach(day => {
    let total = dayTotals[day];
    let totalClass = '';
    if (total === 0) totalClass = 'zero-number';
    else if (total < 2) totalClass = 'green-number';
    else if (total >= 2 && total <= 4) totalClass = 'orange-number';
    else totalClass = 'red-number';
  
    html += `<th onclick="showDayDetails('${day}')">
               <span class="${totalClass}">${total}</span>
             </th>`;
  });
  html += '</tr>';

  html += '</tbody></table>';
  document.getElementById('output').innerHTML = html;
}


function showDetails(subject, day) {
  // Zapisujemy wybrany przedmiot i dzień w localStorage
  localStorage.setItem('selectedSubject', subject);
  localStorage.setItem('selectedDay', day);

  // Pobieramy szczegóły zajęć dla danego przedmiotu i dnia
  const filtered = fullDetails.filter(row => row['przedmiot'] === subject && row['dzień'] === day);
  localStorage.setItem('details', JSON.stringify(filtered));

  // Przechodzimy na stronę szczegółów
  window.location.href = 'details.html';
}

function showDayDetails(day) {
  const filtered = fullDetails.filter(row => row['dzień'] === day);
  localStorage.setItem('details', JSON.stringify(filtered));
  window.location.href = 'details.html';
}

function processExcel(json) {
  globalData = {};
  let daySet = new Set();

  json.forEach(row => {
    const subject = row['przedmiot'];
    let day = row['dzień'];
    if (!subject || !day) return;
    day = formatDate(day);
    if (!isFutureOrToday(day)) return;
    if (!globalData[subject]) globalData[subject] = {};
    if (!globalData[subject][day]) globalData[subject][day] = 0;
    globalData[subject][day] += 1;
    daySet.add(day);
    row['dzień'] = day;
  });

  sortedDays = Array.from(daySet).sort((a, b) => {
    const [ad, am] = a.split('-').map(Number);
    const [bd, bm] = b.split('-').map(Number);
    return new Date(0, am - 1, ad) - new Date(0, bm - 1, bd);
  });

  renderTable();
}

function clearData() {
  localStorage.removeItem('excelData');
  location.reload();
}

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

window.onload = () => {
  const saved = localStorage.getItem('excelData');
  if (saved) {
    const json = JSON.parse(saved);
    fullDetails = json;
    processExcel(json);
  }
};

const daysSelect = document.getElementById('daysSelect');
daysSelect.addEventListener('change', function() {
  const value = this.value === 'all' ? 'all' : parseInt(this.value);
  renderTable(value);
});

// Modal settings
const modal = document.getElementById("settingsModal");
const btn = document.getElementById("settingsBtn");
const span = document.getElementsByClassName("close")[0];

btn.onclick = () => modal.style.display = "block";
span.onclick = () => modal.style.display = "none";
window.onclick = (event) => { if (event.target === modal) modal.style.display = "none"; };
