document.addEventListener('DOMContentLoaded', () => {
    // Referensi untuk tombol
    const btnCetak = document.getElementById('btn-cetak');
    const btnExcel = document.getElementById('btn-excel');

    // Deklarasikan variabel di sini untuk menyimpan data
    let lastAnalysisData = null;

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

            // Simpan data yang berhasil diambil ke dalam variabel
            lastAnalysisData = data;

            // Update elemen HTML dengan data yang diterima (kode ini sudah benar)
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
    
    // Fungsi untuk membuat dan mengunduh file CSV
    function downloadCSV() {
        if (!lastAnalysisData) {
            alert('Data belum tersedia. Halaman akan dimuat ulang.');
            fetchAnalysisData();
            return;
        }
        
        // Header untuk file CSV
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Metrik Analisis;Nilai\r\n"; // Judul kolom

        // Menambahkan data baris per baris
        csvContent += `Total Waktu Pompa Aktif (detik);${lastAnalysisData.total_pump_on_time_seconds}\r\n`;
        csvContent += `Total Data Terekam;${lastAnalysisData.total_records}\r\n`;
        csvContent += `Kelembaban Rata-rata (%);${lastAnalysisData.avg_moisture.toString().replace('.', ',')}\r\n`;
        csvContent += `Kelembaban Tertinggi (%);${lastAnalysisData.max_moisture.toString().replace('.', ',')}\r\n`;
        csvContent += `Kelembaban Terendah (%);${lastAnalysisData.min_moisture.toString().replace('.', ',')}\r\n`;
        csvContent += `Ketinggian Air Rata-rata (cm);${lastAnalysisData.avg_level.toString().replace('.', ',')}\r\n`;
        csvContent += `Ketinggian Air Tertinggi (cm);${lastAnalysisData.max_level.toString().replace('.', ',')}\r\n`;
        csvContent += `Ketinggian Air Terendah (cm);${lastAnalysisData.min_level.toString().replace('.', ',')}\r\n`;
        
        // Membuat link dan memicu unduhan
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "analisis_harian_irigasi.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Tambahkan event listener untuk tombol cetak
    btnCetak.addEventListener('click', () => {
        window.print();
    });
    btnExcel.addEventListener('click', downloadCSV);

    // Panggil fungsi saat halaman dimuat
    fetchAnalysisData();
});