export function showAlert(message: string, color: string) {
  let alertDiv = document.getElementById('face-alert-div') as HTMLDivElement | null;
  if (!alertDiv) {
    alertDiv = document.createElement('div');
    alertDiv.id = 'face-alert-div';
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '30px';
    alertDiv.style.left = '50%';
    alertDiv.style.transform = 'translateX(-50%)';
    alertDiv.style.background = '#fff';
    alertDiv.style.border = '2px solid ' + color;
    alertDiv.style.borderRadius = '10px';
    alertDiv.style.padding = '16px 32px';
    alertDiv.style.fontSize = '1.3rem';
    alertDiv.style.fontWeight = 'bold';
    alertDiv.style.color = color;
    alertDiv.style.zIndex = '2000';
    alertDiv.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)';
    document.body.appendChild(alertDiv);
  }
  if (alertDiv.textContent !== message) {
    alertDiv.textContent = message;
    alertDiv.style.borderColor = color;
    alertDiv.style.color = color;
  }
}

export function clearAlert() {
  const alertDiv = document.getElementById('face-alert-div');
  if (alertDiv) alertDiv.remove();
}

export function updateInfoTable(d: { lx: number; ly: number; rx: number; ry: number; eyeDist: number; isFaceClose: boolean; isSymmetric: boolean; isXCentered: boolean; isYCentered: boolean; isHeadTiltedDown: boolean; canvasWidth: number }) {
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
          <th style="text-align:left;">Info</th>
          <th style="text-align:left;">Value</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    document.body.appendChild(infoTable);
  }
  const tbody = infoTable.querySelector('tbody')!;
  tbody.innerHTML = `
    <tr><td>Left Eye (x, y)</td><td>${d.lx.toFixed(1)}, ${d.ly.toFixed(1)}</td></tr>
    <tr><td>Right Eye (x, y)</td><td>${d.rx.toFixed(1)}, ${d.ry.toFixed(1)}</td></tr>
    <tr><td>Eye Distance</td><td>${d.eyeDist.toFixed(1)} px</td></tr>
    <tr><td>Canvas Width</td><td>${d.canvasWidth.toFixed(1)} px</td></tr>
    <tr><td>Face Close?</td><td style="color:${d.isFaceClose ? '#ff8800' : '#888'}">${d.isFaceClose ? 'Yes' : 'No'}</td></tr>
    <tr><td>Symmetric?</td><td style="color:${d.isSymmetric ? '#3366ff' : '#888'}">${d.isSymmetric ? 'Yes' : 'No'}</td></tr>
    <tr><td>X Centered?</td><td style="color:${d.isXCentered ? '#bb00cc' : '#888'}">${d.isXCentered ? 'Yes' : 'No'}</td></tr>
    <tr><td>Y Centered?</td><td style="color:${d.isYCentered ? '#bb00cc' : '#888'}">${d.isYCentered ? 'Yes' : 'No'}</td></tr>
    <tr><td>Head Tilted Down?</td><td style="color:${d.isHeadTiltedDown ? '#bba000' : '#888'}">${d.isHeadTiltedDown ? 'Yes' : 'No'}</td></tr>
  `;
}

export function removeInfoTable() {
  const infoTable = document.getElementById('face-info-table');
  if (infoTable) infoTable.remove();
} 