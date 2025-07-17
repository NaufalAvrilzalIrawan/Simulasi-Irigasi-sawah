from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import datetime

# --- Inisialisasi Aplikasi Flask ---
app = Flask(__name__)
CORS(app)

# --- Kelas Simulasi (Tidak berubah) ---
class SoilMoistureSensor:
    def __init__(self): self.current_value = random.uniform(30.0, 50.0)
    def read_value(self, pump_is_on=False):
        self.current_value += random.uniform(3.0, 6.0) if pump_is_on else -random.uniform(0.5, 1.5)
        self.current_value = max(0, min(100, self.current_value)); return self.current_value

class WaterLevelSensor:
    def __init__(self): self.current_value = random.uniform(1.0, 3.0)
    def read_value(self, pump_is_on=False):
        self.current_value += random.uniform(0.5, 1.0) if pump_is_on else -random.uniform(0.1, 0.3)
        self.current_value = max(0, self.current_value); return self.current_value

class Actuator:
    def __init__(self): self.state = "OFF"
    def set_state(self, new_state):
        if new_state.upper() in ["ON", "OFF"]: self.state = new_state.upper()
    def is_on(self): return self.state == "ON"

class EdgeGateway:
    def __init__(self, moisture_sensor, level_sensor, actuator):
        self.moisture_sensor, self.level_sensor, self.actuator = moisture_sensor, level_sensor, actuator
        self.MOISTURE_LOW_THRESHOLD, self.MOISTURE_HIGH_THRESHOLD, self.LEVEL_EMERGENCY_THRESHOLD = 40.0, 75.0, 15.0
        self.log_message = "Sistem Siap."

    def run_logic_cycle(self):
        is_pump_on = self.actuator.is_on()
        moisture, level = self.moisture_sensor.read_value(is_pump_on), self.level_sensor.read_value(is_pump_on)
        self.log_message = f"Otomatis | Kelembaban: {moisture:.1f}%, Level: {level:.1f} cm"

        if level > self.LEVEL_EMERGENCY_THRESHOLD:
            self.actuator.set_state("OFF"); self.log_message = "DARURAT: Level air terlalu tinggi! Pompa dimatikan."
        elif moisture < self.MOISTURE_LOW_THRESHOLD: self.actuator.set_state("ON")
        elif moisture > self.MOISTURE_HIGH_THRESHOLD: self.actuator.set_state("OFF")
        
        return {"timestamp": datetime.datetime.now().strftime("%H:%M:%S"), "moisture": round(moisture, 1),
                "level": round(level, 1), "pump_state": self.actuator.state, "log": self.log_message}

# BARU: Kelas untuk menangani pengumpulan dan analisis data
class AnalysisHandler:
    def __init__(self):
        self.session_history = []
        self.CYCLE_DURATION_SECONDS = 2 # Sesuai dengan interval di JS

    def add_record(self, data):
        self.session_history.append(data)

    def calculate_summary(self):
        if not self.session_history: return {"error": "Belum ada data untuk dianalisis."}
        
        total_pump_on_cycles = sum(1 for record in self.session_history if record['pump_state'] == 'ON')
        moisture_values = [r['moisture'] for r in self.session_history]
        level_values = [r['level'] for r in self.session_history]

        summary = {
            "total_records": len(self.session_history),
            "total_pump_on_time_seconds": total_pump_on_cycles * self.CYCLE_DURATION_SECONDS,
            "max_moisture": max(moisture_values),
            "min_moisture": min(moisture_values),
            "avg_moisture": round(sum(moisture_values) / len(moisture_values), 1),
            "max_level": max(level_values),
            "min_level": min(level_values),
            "avg_level": round(sum(level_values) / len(level_values), 1),
        }
        return summary

# --- Inisialisasi Objek Global ---
edge_gateway = EdgeGateway(SoilMoistureSensor(), WaterLevelSensor(), Actuator())
analysis_handler = AnalysisHandler() # BARU

# --- API ENDPOINTS ---
@app.route('/data')
def get_data():
    current_status = edge_gateway.run_logic_cycle()
    analysis_handler.add_record(current_status) # MODIFIKASI: Simpan setiap data untuk analisis
    return jsonify(current_status)

@app.route('/control', methods=['POST'])
def control_pump():
    data = request.get_json()
    command = data.get('command')
    if command:
        edge_gateway.actuator.set_state(command)
        edge_gateway.log_message = f"MANUAL OVERRIDE: Pompa diatur ke {command} oleh pengguna."
        return jsonify({"status": "success", "new_state": command})
    return jsonify({"status": "failed"}), 400

# BARU: Endpoint untuk halaman analisis
@app.route('/analysis')
def get_analysis():
    summary = analysis_handler.calculate_summary()
    return jsonify(summary)

if __name__ == '__main__':
    print("🚀 Server simulasi irigasi berjalan di http://127.0.0.1:5000")
    print("   Buka file 'index.html' di browser untuk melihat dashboard.")
    app.run(port=5000)