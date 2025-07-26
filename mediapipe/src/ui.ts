// Configuration constants
const UI_CONFIG = {
  TABLE: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(255,255,255,0.85)',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontFamily: 'sans-serif',
    fontSize: '15px',
    zIndex: '1000',
    minWidth: '260px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '8px'
  },
  COLORS: {
    boolean: {
      true: '#3366ff',
      false: '#888'
    }
  }
};

export function updateInfoTable(data: Record<string, any>) {
  let infoTable = document.getElementById('face-info-table') as HTMLTableElement | null;
  
  if (!infoTable) {
    infoTable = document.createElement('table');
    infoTable.id = 'face-info-table';
    
    // Apply styles
    Object.assign(infoTable.style, UI_CONFIG.TABLE);
    
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
  const rows = Object.keys(data).map((key: string) => {
    const value = data[key];
    let displayValue: string;
    let style = '';
    
    if (typeof value === 'number') {
      displayValue = value.toFixed(2);
    } else if (typeof value === 'boolean') {
      displayValue = value ? 'Yes' : 'No';
      style = `color:${UI_CONFIG.COLORS.boolean[value.toString() as keyof typeof UI_CONFIG.COLORS.boolean]};font-weight:bold;`;
    } else {
      displayValue = String(value);
    }
    
    return `<tr><td>${key}</td><td style="${style}">${displayValue}</td></tr>`;
  }).join('');
  
  tbody.innerHTML = rows;
}

export function removeInfoTable() {
  const infoTable = document.getElementById('face-info-table');
  if (infoTable) infoTable.remove();
} 