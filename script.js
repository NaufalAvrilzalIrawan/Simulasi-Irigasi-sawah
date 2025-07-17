document.addEventListener('DOMContentLoaded', () => {
    // Referensi elemen HTML
    const moistureValueElem = document.getElementById('moisture-value');
    const moistureCategoryElem = document.getElementById('moisture-category');
    const levelValueElem = document.getElementById('level-value');
    const pumpStateElem = document.getElementById('pump-state');
    const pumpIndicatorElem = document.getElementById('pump-indicator'); // Pastikan ini ada
    const logMessageElem = document.getElementById('log-message');
    const btnOn = document.getElementById('btn-on');
    const btnOff = document.getElementById('btn-off');
    // Definisikan ambang batas di frontend
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
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            scales: {
                x: { ticks: { color: '#333', font: { size: 10 } } },
                y: {
                    type: 'linear', display: true, position: 'left',
                    ticks: { color: '#333', font: { size: 10 } },
                    title: { display: true, text: 'Kelembaban (%)' },
                    suggestedMin: 0, suggestedMax: 100
                },
                y1: {
                    type: 'linear', display: true, position: 'right',
                    ticks: { color: '#333', font: { size: 10 } },
                    title: { display: true, text: 'Ketinggian Air (cm)' },
                    grid: { drawOnChartArea: false },
                    suggestedMin: 0, suggestedMax: 20
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
            moistureCategoryElem.textContent = data.category;
            updateCategoryStyle(data.category);

            levelValueElem.textContent = `${data.level} cm`;
            pumpStateElem.textContent = data.pump_state;
            logMessageElem.textContent = `[${data.timestamp}] ${data.log}`;
            
            // LOGIKA PENTING UNTUK INDIKATOR
            if (data.pump_state === 'ON') {
                pumpIndicatorElem.classList.add('status-on');
                pumpIndicatorElem.classList.remove('status-off');
            } else {
                pumpIndicatorElem.classList.add('status-off');
                pumpIndicatorElem.classList.remove('status-on');
            }
            
            // Tambahkan logika untuk tombol ON berdasarkan level air
            checkWaterLevelAndSetButton(data.level);

            // Update data grafik
            updateChart(data.timestamp, data.moisture, data.level);

        } catch (error) {
            console.error('Gagal mengambil data:', error);
            logMessageElem.textContent = "Error: Tidak dapat terhubung ke server. Pastikan server.py sudah berjalan.";
        }
    }

    function updateCategoryStyle(category) {
        const elem = document.getElementById('moisture-category');
        elem.className = 'category-text';
        
        switch (category) {
            case "Sangat Kering": elem.classList.add('cat-sangat-kering'); break;
            case "Kering": elem.classList.add('cat-kering'); break;
            case "Lembab": elem.classList.add('cat-lembab'); break;
            case "Basah": elem.classList.add('cat-basah'); break;
            case "Sangat Basah": elem.classList.add('cat-sangat-basah'); break;
        }
    }
    
    function checkWaterLevelAndSetButton(level) {
        // Kondisi darurat: Level air terlalu tinggi
        if (level >= WATER_LEVEL_EMERGENCY) {
            btnOn.disabled = true;
            btnOn.classList.remove('btn-warning');
            btnOn.title = 'Level air terlalu tinggi! Pompa tidak bisa dinyalakan.';
        } else if (level >= WATER_LEVEL_WARNING) {
            btnOn.disabled = false;
            btnOn.classList.add('btn-warning');
            btnOn.title = 'Level air mendekati batas. Gunakan dengan hati-hati.';
        } else {
            btnOn.disabled = false;
            btnOn.classList.remove('btn-warning');
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