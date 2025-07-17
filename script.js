document.addEventListener('DOMContentLoaded', () => {
    // Referensi elemen HTML
    const moistureValueElem = document.getElementById('moisture-value');
    const levelValueElem = document.getElementById('level-value');
    const pumpStateElem = document.getElementById('pump-state');
    const pumpIndicatorElem = document.getElementById('pump-indicator');
    const logMessageElem = document.getElementById('log-message');
    const btnOn = document.getElementById('btn-on');
    const btnOff = document.getElementById('btn-off');
    
    // BARU: Definisikan ambang batas di frontend
    const WATER_LEVEL_WARNING = 10.0;
    const WATER_LEVEL_EMERGENCY = 15.0;

    // Inisialisasi Grafik
    const ctx = document.getElementById('sensorChart').getContext('2d');
    const sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Waktu
            datasets: [{
                label: 'Kelembaban Tanah (%)',
                data: [],
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2,
                yAxisID: 'y',
            }, {
                label: 'Ketinggian Air (cm)',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                yAxisID: 'y1',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#333' } },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Kelembaban (%)' },
                    suggestedMin: 0,
                    suggestedMax: 100
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Ketinggian Air (cm)' },
                    grid: { drawOnChartArea: false },
                    suggestedMin: 0,
                    suggestedMax: 20
                }
            }
        }
    });

    // Fungsi untuk mengambil data dari server Python
    async function fetchData() {
        try {
            const response = await fetch('http://127.0.0.1:5000/data');
            const data = await response.json();

            // Update nilai di kartu
            moistureValueElem.textContent = `${data.moisture} %`;
            levelValueElem.textContent = `${data.level} cm`;
            pumpStateElem.textContent = data.pump_state;
            logMessageElem.textContent = `[${data.timestamp}] ${data.log}`;
            
            // Update indikator status pompa
            if (data.pump_state === 'ON') {
                pumpIndicatorElem.classList.add('status-on');
                pumpIndicatorElem.classList.remove('status-off');
            } else {
                pumpIndicatorElem.classList.add('status-off');
                pumpIndicatorElem.classList.remove('status-on');
            }
            
            // MODIFIKASI: Tambahkan logika untuk tombol ON berdasarkan level air
            checkWaterLevelAndSetButton(data.level);

            // Update data grafik
            updateChart(data.timestamp, data.moisture, data.level);

        } catch (error) {
            console.error('Gagal mengambil data:', error);
            logMessageElem.textContent = "Error: Tidak dapat terhubung ke server. Pastikan server.py sudah berjalan.";
        }
    }

    // BARU: Fungsi untuk mengatur status tombol ON
    function checkWaterLevelAndSetButton(level) {
        // Kondisi darurat: Level air terlalu tinggi
        if (level >= WATER_LEVEL_EMERGENCY) {
            btnOn.disabled = true; // Nonaktifkan tombol
            btnOn.classList.remove('btn-warning'); // Hapus class warning jika ada
            btnOn.title = 'Level air terlalu tinggi! Pompa tidak bisa dinyalakan.';
        } 
        // Kondisi peringatan: Level air mendekati batas
        else if (level >= WATER_LEVEL_WARNING) {
            btnOn.disabled = false; // Tombol tetap aktif
            btnOn.classList.add('btn-warning'); // Tambah class warning (warna oranye)
            btnOn.title = 'Level air mendekati batas. Gunakan dengan hati-hati.';
        } 
        // Kondisi Normal
        else {
            btnOn.disabled = false; // Tombol aktif
            btnOn.classList.remove('btn-warning'); // Hapus class warning
            btnOn.title = 'Nyalakan pompa secara manual.';
        }
    }

    // Fungsi untuk update grafik
    function updateChart(label, moistureData, levelData) {
        sensorChart.data.labels.push(label);
        sensorChart.data.datasets[0].data.push(moistureData);
        sensorChart.data.datasets[1].data.push(levelData);

        if (sensorChart.data.labels.length > 20) {
            sensorChart.data.labels.shift();
            sensorChart.data.datasets.forEach(dataset => dataset.data.shift());
        }
        sensorChart.update();
    }

    // Fungsi untuk mengirim perintah manual
    async function sendControlCommand(command) {
        try {
            await fetch('http://127.0.0.1:5000/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: command })
            });
            fetchData();
        } catch (error) {
            console.error('Gagal mengirim perintah:', error);
        }
    }

    // Tambahkan event listener untuk tombol
    btnOn.addEventListener('click', () => sendControlCommand('ON'));
    btnOff.addEventListener('click', () => sendControlCommand('OFF'));


    // Ambil data setiap 2 detik
    setInterval(fetchData, 2000);
    // Ambil data pertama kali saat halaman dimuat
    fetchData(); 
});