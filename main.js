const form = document.getElementById('basic-form');
const canvas = document.getElementById('canvas-item');
const canvasFigure = document.getElementById('canvas-figure');
const ctxFigure = canvasFigure.getContext('2d');
const ctx = canvas.getContext('2d');
const errorBox = document.getElementById('error-msg');

const historyButton = document.getElementById('dummy-form');
const R_pixels = 40; 

let ox = 0, oy = 0, moveX = 0, moveY = 0;
let radius = 0;
let dragging = false
let historyStorage = [];

initPage();

function initPage() {
    const savedData = localStorage.getItem('pointsHistory');
    if (savedData) {
        historyStorage = JSON.parse(savedData);
    }
    const lastR = historyStorage.length > 0 ? historyStorage[historyStorage.length - 1].r : 2;
    drawCanvasBase(lastR);
    ox = canvasFigure.width / 2;
    oy = canvasFigure.height / 2;
    drawFigure(ox, oy, lastR);
    console.log('figure drawn', ox, oy, lastR);
    renderHistory();
};

function showError(text) {
    errorBox.textContent = text;
    errorBox.classList.add('show')
}
function clearError() {
    errorBox.classList.remove('show');
}

form.addEventListener('input', clearError);

form.addEventListener('submit', function(event) {
    event.preventDefault();
    clearError();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (!data.x) { showError('Выберите X!'); return; }
    if (!data.r) { showError('Выберите R!'); return; }

    const yRaw = data.y.trim().replace(',', '.');
    const yValue = +yRaw;
    if (yRaw === '' || isNaN(yValue) || yValue < -5 || yValue > 5) {
        showError('Y должен быть числом от -5 до 5');
        return;
    }

    data.y = yValue;
    process(data);
});

historyButton.addEventListener('submit', function(event) {
        event.preventDefault();        
        historyStorage = [];
        localStorage.removeItem('pointsHistory');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCanvasBase(2);
        renderHistory();
       
    }
);

canvasFigure.addEventListener('pointerdown', e => {
    const rad = radius * R_pixels;
    const px = e.offsetX - ox
    const py = oy - e.offsetY
    if (!checkHit(px, py, rad)) return;
    dragging = true
    moveX = e.offsetX - ox;
    moveY = e.offsetY - oy;
    canvasFigure.setPointerCapture(e.pointerId);
    canvasFigure.style.cursor = 'grabbing';
});

canvasFigure.addEventListener('pointermove', e => {
    if (!dragging) return;
    const rPix = radius * R_pixels;
    ox = clamp(e.offsetX - moveX, rPix, canvasFigure.width - rPix);
    oy = clamp(e.offsetY - moveY, rPix, canvasFigure.height - rPix);
    drawFigure(ox, oy, radius);
});

canvasFigure.addEventListener('pointerup', () => {
   dragging = false;
   canvasFigure.style.cursor = 'grab';
});

function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
};

function drawFigure(x, y, selectedR) {
    radius = selectedR
    ctxFigure.clearRect(0, 0, canvas.width, canvas.height);
    
    const cx = x;
    const cy = y;
    const R = selectedR; //? parseFloat(selectedR) : 2;
    
    const rPix = R * R_pixels;
    const halfRPix = rPix / 2;

    ctxFigure.fillStyle = 'rgba(54, 162, 235, 0.8)';
    ctxFigure.beginPath();
    ctxFigure.moveTo(cx, cy);
    ctxFigure.arc(cx, cy, rPix, 0, 1.5 * Math.PI, true);
    ctxFigure.lineTo(cx - rPix, cy - rPix);
    ctxFigure.lineTo(cx - rPix, cy);
    ctxFigure.lineTo(cx - halfRPix, cy);
    ctxFigure.lineTo(cx, cy + rPix);
    ctxFigure.closePath();
    ctxFigure.fill();
};

function drawCanvasBase(selectedR) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const R = selectedR ? parseFloat(selectedR) : 2;
    
    const rPix = R * R_pixels;
    const halfRPix = rPix / 2;

    ctx.beginPath();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    
    ctx.moveTo(10, cy); ctx.lineTo(canvas.width - 10, cy);
    ctx.lineTo(canvas.width - 20, cy - 5);
    ctx.moveTo(canvas.width - 10, cy);
    ctx.lineTo(canvas.width - 20, cy + 5);
    
    ctx.moveTo(cx, canvas.height - 10); ctx.lineTo(cx, 10);
    ctx.lineTo(cx - 5, 20);
    ctx.moveTo(cx, 10);
    ctx.lineTo(cx + 5, 20);
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = 'italic bold 14px sans-serif';
    ctx.fillText('x', canvas.width - 15, cy - 10);
    ctx.fillText('y', cx + 10, 15);

    ctx.font = '12px sans-serif';
    ctx.lineWidth = 1;
    
    const drawTickX = (x, text) => {
        ctx.beginPath(); ctx.moveTo(x, cy - 4); ctx.lineTo(x, cy + 4); ctx.stroke();
        ctx.fillText(text, x - 10, cy + 18);
    };
    const drawTickY = (y, text) => {
        ctx.beginPath(); ctx.moveTo(cx - 4, y); ctx.lineTo(cx + 4, y); ctx.stroke();
        ctx.fillText(text, cx + 10, y + 4);
    };
    
    drawTickX(cx - rPix, -R);
    drawTickX(cx - halfRPix, -R/2);
    drawTickX(cx + halfRPix, R/2);
    drawTickX(cx + rPix, R);

    drawTickY(cy - rPix, R);
    drawTickY(cy - halfRPix, R/2);
    drawTickY(cy + halfRPix, -R/2);
    drawTickY(cy + rPix, -R);
    
    ctx.fillText('0', cx - 12, cy + 14);
}

function checkHit(x, y, r) {
    if (x >= 0 && y >= 0) {
        return (x * x + y * y) <= (r * r);
    }
    if (x <= 0 && y >= 0) {
        return (x >= -r) && (y <= r);
    }
    if (x <= 0 && y <= 0) {
        return y >= (-2 * x - r);
    }
    return false;
}

function process(data) {
    const xNum = parseInt(data.x, 10);
    const rNum = parseFloat(data.r);

    const rPix = rNum * R_pixels;
    ox = clamp(ox, rPix, canvasFigure.width - rPix);
    oy = clamp(oy, rPix, canvasFigure.height - rPix);
    drawFigure(ox, oy, rNum);

    const px = canvas.width / 2 + xNum * R_pixels;
    const py = canvas.height / 2 - data.y * R_pixels;
    const isHit = checkHit(px - ox, oy - py, rPix);

    const newPoint = {
        x: xNum,
        y: data.y,
        r: rNum,
        timestamp: Date.now(), 
        hit: isHit
    };

    historyStorage.push(newPoint);
    localStorage.setItem('pointsHistory', JSON.stringify(historyStorage));

    drawCanvasBase(rNum);
    renderHistory();
}

function renderHistory() {
    const tbody = document.getElementById('results-body');
    tbody.innerHTML = ''; 

    if (historyStorage.length === 0) return;

    historyStorage.forEach(point => {
        
        const dateObject = new Date(point.timestamp);
        const localDateTimeStr = dateObject.toLocaleString('ru-RU'); 

        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${point.x}</td>
            <td>${point.y}</td>
            <td>${point.r}</td>
            <td>${localDateTimeStr}</td>
            <td style="color: ${point.hit ? '#27ae60' : '#c0392b'}; font-weight: bold;">
                ${point.hit ? 'Попала' : 'Не попала'}
            </td>
        `;
        tbody.prepend(newRow);
    });
    for (let i=0; i<historyStorage.length-1; i += 1) {
        const lastPoint = historyStorage[i];
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const px = cx + (lastPoint.x * R_pixels);
        const py = cy - (lastPoint.y * R_pixels);

        ctx.beginPath();
        ctx.fillStyle = '#c3b4b6';
        ctx.arc(px, py, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#686666';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(`(${lastPoint.x}, ${lastPoint.y})`, px + 8, py - 8);
    };
    const lastPoint = historyStorage[historyStorage.length - 1];

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const px = cx + (lastPoint.x * R_pixels);
    const py = cy - (lastPoint.y * R_pixels);

    ctx.beginPath();
    ctx.fillStyle = '#ff4757';
    ctx.arc(px, py, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(`(${lastPoint.x}, ${lastPoint.y})`, px + 8, py - 8);
}