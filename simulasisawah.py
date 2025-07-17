import random
import time
import datetime

# --- LAPISAN FISIK (SENSOR & AKTUATOR) ---

class Sensor:
    """Kelas dasar untuk semua sensor."""
    def __init__(self, name):
        self.name = name
        self.current_value = 0

    def read_value(self):
        raise NotImplementedError("Subclass harus mengimplementasikan metode ini")

class SoilMoistureSensor(Sensor):
    """Simulasi Sensor Kelembaban Tanah."""
    def __init__(self, name="Sensor Kelembaban Tanah"):
        super().__init__(name)
        # Kelembaban awal antara 30% dan 50%
        self.current_value = random.uniform(30.0, 50.0)

    def read_value(self, pump_is_on=False):
        # Jika pompa menyala, kelembaban naik. Jika mati, kelembaban turun (simulasi penguapan).
        if pump_is_on:
            self.current_value += random.uniform(3.0, 6.0)
        else:
            self.current_value -= random.uniform(0.5, 1.5)
        
        # Batasi nilai antara 0 dan 100
        self.current_value = max(0, min(100, self.current_value))
        return self.current_value

class WaterLevelSensor(Sensor):
    """Simulasi Sensor Ketinggian Air."""
    def __init__(self, name="Sensor Ketinggian Air"):
        super().__init__(name)
        # Ketinggian air awal antara 1 cm dan 3 cm
        self.current_value = random.uniform(1.0, 3.0)

    def read_value(self, pump_is_on=False):
        # Jika pompa menyala, level air naik. Jika mati, level turun.
        if pump_is_on:
            self.current_value += random.uniform(0.5, 1.0)
        else:
            self.current_value -= random.uniform(0.1, 0.3)
        
        # Batasi nilai agar tidak negatif
        self.current_value = max(0, self.current_value)
        return self.current_value

class Actuator:
    """Simulasi aktuator seperti pompa air atau katup."""
    def __init__(self, name="Pompa Air"):
        self.name = name
        self.state = "OFF"
        print(f"[{self.name}] Inisialisasi, status: {self.state}")

    def turn_on(self):
        if self.state == "OFF":
            self.state = "ON"
            print(f"💧 [{self.name}] AKSI: Dinyalakan.")

    def turn_off(self):
        if self.state == "ON":
            self.state = "OFF"
            print(f"🛑 [{self.name}] AKSI: Dimatikan.")
            
    def is_on(self):
        return self.state == "ON"

# --- LAPISAN EDGE ---

class EdgeGateway:
    """Simulasi Edge Gateway yang membuat keputusan lokal."""
    def __init__(self, moisture_sensor, level_sensor, actuator, cloud_platform):
        self.moisture_sensor = moisture_sensor
        self.level_sensor = level_sensor
        self.actuator = actuator
        self.cloud = cloud_platform
        
        # Aturan lokal yang disimpan di Edge
        self.MOISTURE_LOW_THRESHOLD = 40.0  # Jika di bawah ini, nyalakan pompa
        self.MOISTURE_HIGH_THRESHOLD = 75.0 # Jika di atas ini, matikan pompa
        self.LEVEL_EMERGENCY_THRESHOLD = 15.0 # Jika di atas ini, matikan pompa (darurat)
        
        self.data_send_counter = 0

    def run_logic_cycle(self):
        """Menjalankan satu siklus logika di Edge."""
        # 1. Baca data dari sensor
        is_pump_on = self.actuator.is_on()
        moisture = self.moisture_sensor.read_value(is_pump_on)
        level = self.level_sensor.read_value(is_pump_on)
        
        print(f"🌿 [EDGE] Membaca sensor -> Kelembaban: {moisture:.1f}%, Ketinggian Air: {level:.1f} cm")

        # 2. Logika keputusan lokal (OTOMATIS)
        if level > self.LEVEL_EMERGENCY_THRESHOLD:
            print("🚨 [EDGE] KONDISI DARURAT! Ketinggian air terlalu tinggi!")
            self.actuator.turn_off()
        elif moisture < self.MOISTURE_LOW_THRESHOLD:
            self.actuator.turn_on()
        elif moisture > self.MOISTURE_HIGH_THRESHOLD:
            self.actuator.turn_off()

        # 3. Kirim data ke cloud secara berkala (simulasi filter data)
        self.data_send_counter += 1
        if self.data_send_counter >= 3:
            print("📡 [EDGE] Mengirim data ringkas ke Cloud...")
            data_packet = {
                "timestamp": datetime.datetime.now().isoformat(),
                "moisture": round(moisture, 2),
                "level": round(level, 2),
                "pump_state": self.actuator.state
            }
            self.cloud.receive_data_from_edge(data_packet)
            self.data_send_counter = 0

# --- LAPISAN CLOUD & APLIKASI PENGGUNA ---

class CloudPlatform:
    """Simulasi platform Cloud untuk menyimpan data dan mengelola perintah."""
    def __init__(self):
        self.data_history = []
        print("☁️ [CLOUD] Platform siap menerima data.")

    def receive_data_from_edge(self, data):
        self.data_history.append(data)
        print("☁️ [CLOUD] Data diterima dan disimpan.")

    def get_latest_data(self):
        if not self.data_history:
            return None
        return self.data_history[-1]

class UserApplication:
    """Simulasi aplikasi pengguna (dashboard)."""
    def __init__(self, cloud_platform):
        self.cloud = cloud_platform

    def view_dashboard(self):
        print("\n================== DASHBOARD PENGGUNA ==================")
        latest_data = self.cloud.get_latest_data()
        if latest_data:
            print(f"📊 Laporan Terakhir pada {latest_data['timestamp']}:")
            print(f"   - Kelembaban Tanah: {latest_data['moisture']}%")
            print(f"   - Ketinggian Air: {latest_data['level']} cm")
            print(f"   - Status Pompa: {latest_data['pump_state']}")
        else:
            print("Belum ada data yang diterima dari sawah.")
        print("========================================================\n")

    def trigger_manual_irrigation(self, command, edge_gateway):
        """Simulasi pengguna menekan tombol manual."""
        print(f"📱 [PENGGUNA] Mengirim perintah manual: '{command}'...")
        if command.upper() == "ON":
            edge_gateway.actuator.turn_on()
        elif command.upper() == "OFF":
            edge_gateway.actuator.turn_off()
        else:
            print("Perintah tidak valid.")

# --- MAIN SIMULATION ---

if __name__ == "__main__":
    # 1. Inisialisasi semua komponen sistem
    cloud = CloudPlatform()
    moisture_sensor = SoilMoistureSensor()
    level_sensor = WaterLevelSensor()
    pump = Actuator()
    edge = EdgeGateway(moisture_sensor, level_sensor, pump, cloud)
    app = UserApplication(cloud)

    print("\n\n🚀 MEMULAI SIMULASI SISTEM IRIGASI CERDAS 🚀\n")
    time.sleep(2)

    # 2. Jalankan simulasi untuk 20 siklus waktu
    for i in range(20):
        print(f"\n--- Siklus Waktu {i+1} ---")
        
        # Jalankan logika di Edge
        edge.run_logic_cycle()

        # Skenario interaksi pengguna
        if i == 5:
            print("\n✨ SKENARIO: Pengguna mengecek dashboard...")
            time.sleep(1)
            app.view_dashboard()

        if i == 12:
            print("\n✨ SKENARIO: Pengguna menyalakan pompa secara manual...")
            time.sleep(1)
            app.trigger_manual_irrigation("ON", edge)
            
        if i == 16:
            print("\n✨ SKENARIO: Pengguna mematikan pompa secara manual...")
            time.sleep(1)
            app.trigger_manual_irrigation("OFF", edge)

        time.sleep(2) # Jeda untuk memudahkan pembacaan output

    print("\n🏁 SIMULASI SELESAI 🏁")
    app.view_dashboard() # Tampilkan status akhir