/**
 * Hardware Telemetry & Sensor Definitions for TEAM SPUTNIK DASHBOARD
 * Supports MPU6050, BMP280, DHT11, and NEO-6M
 */

export interface MPU6050Data {
  accelX: number; // m/s^2
  accelY: number;
  accelZ: number;
  gyroX: number; // deg/s
  gyroY: number;
  gyroZ: number;
  pitchDeg: number;
  rollDeg: number;
  yawDeg: number;
  totalG: number;
  temperatureC: number;
  status: 'ONLINE' | 'CALIBRATING' | 'DRIFT_CORRECTED';
  sampleRateHz: number;
  i2cAddress: string;
}

export interface BMP280Data {
  pressureHpa: number;
  pressurePa: number;
  altitudeMeters: number;
  altitudeFeet: number;
  temperatureC: number;
  seaLevelPressureHpa: number;
  verticalSpeedMS: number; // VSI (variometer)
  status: 'ONLINE' | 'OVERSAMPLING_16X' | 'STANDBY';
  sampleRateHz: number;
  i2cAddress: string;
}

export interface DHT11Data {
  temperatureC: number;
  temperatureF: number;
  humidityPercent: number;
  dewPointC: number;
  heatIndexC: number;
  comfortLevel: 'OPTIMAL' | 'HUMID' | 'DRY' | 'WARNING_CONDENSATION';
  status: 'ONLINE' | 'POLLING';
  sampleRateHz: number;
  pinInterface: string;
}

export interface NEO6MData {
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  groundSpeedKmH: number;
  groundSpeedKnots: number;
  courseDeg: number;
  fixType: '3D FIX' | '2D FIX' | 'SEARCHING';
  satellitesTracked: number;
  satellitesInView: number;
  hdop: number;
  utcTime: string;
  rawNmeaSentence: string;
  status: 'LOCKED' | 'ACQUIRING';
  baudRate: number;
  uartInterface: string;
}

export interface SensorSuiteData {
  mpu6050: MPU6050Data;
  bmp280: BMP280Data;
  dht11: DHT11Data;
  neo6m: NEO6MData;
}

export type SelectedSensorTab = 'all' | 'mpu6050' | 'bmp280' | 'dht11' | 'neo6m' | 'deep-space';
