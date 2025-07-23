export function updateInfoTable(d: Record<string, any>) {
  let infoTable = document.getElementById('face-info-table') as HTMLTableElement | null;
  if (!infoTable) {
    infoTable = document.createElement('table');
    infoTable.id = 'face-info-table';
    infoTable.style.position = 'absolute';
    infoTable.style.top = '20px';
    infoTable.style.right = '20px';
    infoTable.style.background = 'rgba(255,255,255,0.85)';
    infoTable.style.border = '1px solid #ccc';
    infoTable.style.borderRadius = '8px';
    infoTable.style.fontFamily = 'sans-serif';
    infoTable.style.fontSize = '15px';
    infoTable.style.zIndex = '1000';
    infoTable.style.minWidth = '260px';
    infoTable.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    infoTable.style.padding = '8px';
    infoTable.innerHTML = `
      <thead>
        <tr>
          <th style="text-align:left;">Variable</th>
          <th style="text-align:left;">Value</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    document.body.appendChild(infoTable);
  }
  const tbody = infoTable.querySelector('tbody')!;
  let rows = '';
  for (const key in d) {
    if (Object.prototype.hasOwnProperty.call(d, key)) {
      const value = d[key];
      let displayValue: string;
      let style = '';
      if (typeof value === 'number') {
        displayValue = value.toFixed(2);
      } else if (typeof value === 'boolean') {
        displayValue = value ? 'Yes' : 'No';
        // Optionally color booleans for visibility
        style = `color:${value ? '#3366ff' : '#888'};font-weight:bold;`;
      } else {
        displayValue = String(value);
      }
      rows += `<tr><td>${key}</td><td style="${style}">${displayValue}</td></tr>`;
    }
  }
  tbody.innerHTML = rows;
}

export function removeInfoTable() {
  const infoTable = document.getElementById('face-info-table');
  if (infoTable) infoTable.remove();
} 