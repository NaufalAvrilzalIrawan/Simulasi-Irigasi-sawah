document.addEventListener('DOMContentLoaded', () => {
    // Fungsi untuk mengambil dan menampilkan data analisis
    async function fetchAnalysisData() {
        try {
            const response = await fetch('http://127.0.0.1:5000/analysis');
            const data = await response.json();

            if (data.error) {
                console.error(data.error);
                alert('Belum ada data yang cukup untuk dianalisis. Jalankan dashboard utama terlebih dahulu.');
                return;
            }

            // Update elemen HTML dengan data yang diterima
            document.getElementById('total-pump-time').textContent = `${data.total_pump_on_time_seconds} detik`;
            document.getElementById('total-records').textContent = data.total_records;

            document.getElementById('avg-moisture').textContent = data.avg_moisture;
            document.getElementById('max-moisture').textContent = data.max_moisture;
            document.getElementById('min-moisture').textContent = data.min_moisture;

            document.getElementById('avg-level').textContent = data.avg_level;
            document.getElementById('max-level').textContent = data.max_level;
            document.getElementById('min-level').textContent = data.min_level;

        } catch (error) {
            console.error('Gagal mengambil data analisis:', error);
            alert('Gagal terhubung ke server. Pastikan server.py sudah berjalan.');
        }
    }

    // Panggil fungsi saat halaman dimuat
    fetchAnalysisData();
});