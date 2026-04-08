// Cấu hình URL Google Apps Script từ bạn
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzViEYJCUkGFTnIYmNZRMJ_Zix5yXfExvPn5yWx3nQ0/exec";

let html5QrCode;
let lastResult = "";

// Chuyển đổi giữa các Tab
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));

    if (tab === 'scan') {
        document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('scan-view').classList.add('active');
        startScanner();
    } else {
        document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('history-view').classList.add('active');
        stopScanner();
        loadHistory();
    }
}

// Khởi chạy trình quét mã vạch
function startScanner() {
    if (html5QrCode && html5QrCode.isScanning) return;

    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
        { facingMode: "environment" }, 
        config,
        (decodedText, decodedResult) => {
            // Khi quét thành công
            onScanSuccess(decodedText);
        },
        (errorMessage) => {
            // Lỗi khi đang tìm mã
        }
    ).catch((err) => {
        console.error("Lỗi camera:", err);
        document.getElementById('scan-status').innerText = "Không thể truy cập camera. Vui lòng cấp quyền!";
    });
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            console.log("Dừng camera.");
        }).catch(err => console.error(err));
    }
}

function onScanSuccess(decodedText) {
    if (lastResult === decodedText) return; // Tránh quét lặp
    
    lastResult = decodedText;
    document.getElementById('scanned-result').innerText = decodedText;
    document.getElementById('time-display').innerText = "Thời gian: " + new Date().toLocaleString('vi-VN');
    document.getElementById('send-btn').disabled = false;
    document.getElementById('scan-status').innerText = "Đã nhận mã!";

    // Rung phản hồi (nếu thiết bị hỗ trợ)
    if (navigator.vibrate) navigator.vibrate(100);
}

// Gửi dữ liệu lên Google Sheets
async function sendData() {
    if (APP_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
        showToast("Lỗi: Chưa cấu hình URL Apps Script!");
        return;
    }

    const btn = document.getElementById('send-btn');
    btn.disabled = true;
    showToast("Đang gửi dữ liệu...");

    const data = {
        orderId: "NVH-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
        content: lastResult,
        scanTime: new Date().toLocaleString('vi-VN')
    };

    try {
        const response = await fetch(APP_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors", // Cần mode no-cors cho Apps Script
            cache: "no-cache",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        // Với no-cors, chúng ta không thể đọc response body, nhưng thường là thành công
        showToast("Gửi thành công!");
        document.getElementById('scan-status').innerText = "Đã lưu đơn hàng!";
    } catch (error) {
        console.error("Lỗi gửi dữ liệu:", error);
        showToast("Gửi thất bại. Thử lại sau!");
        btn.disabled = false;
    }
}

// Tải lịch sử từ Google Sheets
async function loadHistory() {
    if (APP_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") return;

    const listContainer = document.getElementById('history-list');
    
    try {
        const response = await fetch(APP_SCRIPT_URL);
        const data = await response.json();
        
        listContainer.innerHTML = "";
        
        if (data.length === 0) {
            listContainer.innerHTML = "<p class='empty-msg'>Chưa có dữ liệu lịch sử.</p>";
            return;
        }

        data.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-item-header">
                    <span>ID: ${item.orderId}</span>
                    <span>${item.scanTime}</span>
                </div>
                <div class="history-item-content">${item.content}</div>
            `;
            listContainer.appendChild(el);
        });
    } catch (error) {
        listContainer.innerHTML = "<p class='empty-msg'>Lỗi khi tải lịch sử.</p>";
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Khởi chạy mặc định
window.addEventListener('load', () => {
    startScanner();
});
