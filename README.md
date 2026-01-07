# CityPulse: Mohali

Real-time Urban Stress Infrastructure for Smarter Cities

CityPulse is an open-source urban sensing platform that fuses environmental data into a Weighted Urban Stress Index (USI). Designed for the Sustainable Cities (SDG 11) track, it provides real-time visualization and Explainable AI analysis of urban health.



 Quick Start

# 1. Prerequisites

Ensure you have the following installed on your machine (optimized for development on systems like the Asus Vivobook 16X):

* Node.js (v18.0.0 or higher)
* npm (v9.0.0 or higher)
* A Mapbox Access Token (Available at mapbox.com)

# 2. Installation

Clone the repository and install the necessary dependencies:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/citypulse.git

# Navigate into the project directory
cd citypulse

# Install dependencies
npm install

```

# 3. Configuration

Create a .env file in the root directory to store your API keys:

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here

```

# 4. Run the Development Server

Start the local development server to view the dashboard:

```bash
npm run dev

```

The application will be available at http://localhost:5173.



 Project Architecture

# Software Stack

* Frontend: React.js, Tailwind CSS, Lucide Icons
* Mapping: Mapbox GL JS for 3D geospatial visualization
* Animation: Framer Motion for real-time pulsing alerts
* Logic: Weighted sensor fusion and rule-based Explainable AI

# Hardware Integration

This project is built to interface with physical sensing nodes:

* Microcontroller: ESP32
* Sensors: BME280 (Temp/Humidity), INMP441 (Noise), MQ-Series (Air Quality), PIR (Crowd Density)


 The Urban Stress Index

The core of CityPulse is its ability to translate raw data into a human-readable score (0-100) using the following formula:

USI = (0.4 * Noise) + (0.25 * Temp) + (0.2 * AirQuality) + (0.15 * Density)

This score determines the "Pulse" of the city markers:

* Nominal (0-54): Cyan pulse
* Elevated (55-79): Amber pulse
* Critical (80-100): Rapid red pulse + AI Alert

 License

Distributed under the MIT License.



