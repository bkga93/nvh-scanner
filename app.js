// Cấu hình URL Google Apps Script từ bạn
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzViEYJCUkGFTnIYmNZRMJ_Zix5yXfExvPn5yWx3nQ0/exec";

let html5QrCode;
let isScanning = false;
let lastScanTime = 0;
const SCAN_DELAY = 3000; // 3 giây để tránh quét trùng

// Khởi tạo Audio Context cho tiếng "Tít"
let audioCtx;
function playBeep() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Tần số cao cho tiếng tít thanh
    
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// Chuyển đổi giữa các Tab
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));

    if (tab === 'scan') {
        document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('scan-view').classList.add('active');
    } else {
        document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('history-view').classList.add('active');
        if (isScanning) toggleScanner(); // Dừng camera khi xem lịch sử
        loadLocalHistory();
    }
}

// Bật/Tắt Camera
async function toggleScanner() {
    const btn = document.getElementById('start-btn');
    const btnText = document.getElementById('btn-text');
    const btnSub = document.getElementById('btn-subtext');

    if (!isScanning) {
        // Bắt đầu quét
        try {
            if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
            
            // Kích hoạt âm thanh (Yêu cầu tương tác người dùng)
            if (!audioCtx) playBeep();

            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 15, qrbox: { width: 250, height: 250 } },
                onScanSuccess
            );

            isScanning = true;
            btn.classList.add('scanning');
            btnText.innerText = "DỪNG QUÉT";
            btnSub.innerText = "Camera đang hoạt động...";
            document.getElementById('scanner-ui').style.display = 'block';
        } catch (err) {
            showToast("Không thể mở camera!");
            console.error(err);
        }
    } else {
        // Dừng quét
        await stopScanner();
    }
}

async function stopScanner() {
    if (html5QrCode) {
        await html5QrCode.stop();
        isScanning = false;
        const btn = document.getElementById('start-btn');
        btn.classList.remove('scanning');
        document.getElementById('btn-text').innerText = "BẮT ĐẦU QUÉT";
        document.getElementById('btn-subtext').innerText = "Nhấn để khởi động Camera";
    }
}

// Khi quét thành công
async function onScanSuccess(decodedText) {
    const now = Date.now();
    if (now - lastScanTime < SCAN_DELAY) return; // Chặn quét quá nhanh

    lastScanTime = now;
    
    // 1. Phản hồi tức thì
    playBeep();
    if (navigator.vibrate) navigator.vibrate(200);

    // 2. Cập nhật giao diện
    document.getElementById('scanned-result').innerText = decodedText;
    document.getElementById('sync-status').innerText = "Đang gửi...";
    document.getElementById('sync-status').style.color = "var(--primary-color)";

    // 3. Xử lý dữ liệu
    const scanMode = document.querySelector('input[name="scanMode"]:checked').value;
    const orderData = {
        orderId: "NVH-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
        content: decodedText,
        scanTime: new Date().toLocaleString('vi-VN')
    };

    // Lưu vào máy (Local Storage)
    saveToLocal(orderData);

    // Tự động gửi lên Google Sheets
    const success = await sendToGoogleSheets(orderData);

    if (success) {
        document.getElementById('sync-status').innerText = "Đã gửi thành công!";
        document.getElementById('sync-status').style.color = "var(--success)";
    } else {
        document.getElementById('sync-status').innerText = "Lỗi gửi (Đã lưu máy)";
        document.getElementById('sync-status').style.color = "var(--danger)";
    }

    // 4. Kiểm tra chế độ quét
    if (scanMode === 'single') {
        setTimeout(() => {
            stopScanner();
            showToast("Đã xong! Camera đã đóng.");
        }, 500);
    } else {
        showToast("Tiếp tục quét mã tiếp theo...");
    }
}

// Gửi lên Google Sheets
async function sendToGoogleSheets(data) {
    try {
        const response = await fetch(APP_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            cache: "no-cache",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

// Lưu lịch sử cục bộ
function saveToLocal(data) {
    let history = JSON.parse(localStorage.getItem('nvh_scan_history') || '[]');
    history.unshift(data); // Đưa lên đầu danh sách
    localStorage.setItem('nvh_scan_history', JSON.stringify(history.slice(0, 50))); // Lưu tối đa 50 bản
}

function loadLocalHistory() {
    const list = document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('nvh_scan_history') || '[]');
    
    if (history.length === 0) {
        list.innerHTML = "<p class='empty-msg'>Chưa có dữ liệu nào trên máy.</p>";
        return;
    }

    list.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-item-header">
                <strong>ID: ${item.orderId}</strong>
                <span class="history-item-time">${item.scanTime}</span>
            </div>
            <div class="history-item-content">${item.content}</div>
        </div>
    `).join('');
}

function clearLocalHistory() {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử trên máy này?")) {
        localStorage.removeItem('nvh_scan_history');
        loadLocalHistory();
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}
