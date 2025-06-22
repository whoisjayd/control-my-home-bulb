# Tasmota MQTT Smart Bulb Dashboard

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FWhoIsJayD%2Fcontrol-my-home-bulb&env=API_KEY,MQTT_HOST,MQTT_PORT,MQTT_USERNAME,MQTT_PASSWORD,MQTT_PROTOCOL,MQTT_TOPIC,TASMOTA_MAC&envDescription=Enter%20your%20project%20details.%20See%20README%20for%20more%20info.&project-name=my-bulb-control&repository-name=my-bulb-control)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MQTT](https://img.shields.io/badge/MQTT-660066?logo=mqtt&logoColor=white)](https://mqtt.org/)
![visitor badge](https://visitor-badge.laobi.icu/badge?page_id=https://github.com/whoisjayd/control-my-home-bulb)


A robust, responsive, and self-hosted Progressive Web App (PWA) to control your Tasmota-flashed smart bulbs via MQTT. This project provides a modern, intuitive interface to manage your smart lighting with real-time updates and is optimized for one-click deployment on **Vercel**.

![Dashboard Screenshot](https://i.imgur.com/vIQ0ijk.png)

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠️ How It Works](#️-how-it-works)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
- [☁️ Deployment](#️-deployment)
  - [One-Click Vercel Deploy](#one-click-vercel-deploy)
  - [Manual Deployment](#manual-deployment)
- [💻 Local Development](#-local-development)
- [📱 Installing as a PWA](#-installing-as-a-pwa)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)

## ✨ Features

- **Real-Time Control**: Instantly syncs with your bulb's state using an efficient MQTT-first approach, backed by HTTP polling.
- **Full Power Control**: Toggle the bulb on or off with a satisfying, responsive button.
- **White Ambiance**: Fine-tune color temperature from warm (153 mired) to cool (500 mired).
- **RGB Color Selection**: An intuitive hue and saturation slider lets you pick the perfect color.
- **Brightness Dimmer**: Adjust brightness levels from 0% to 100%.
- **Secure Authentication**: Protects your dashboard with a mandatory API key.
- **PWA-Compatible**: Install it as a standalone app on desktop or mobile for a native-like experience with offline support.
- **Live Device Info**: Monitor critical details at a glance:
  - IP Address & Hostname
  - Firmware Version & Module
  - Wi-Fi Signal Strength & Uptime
  - Boot Count & Restart Reason
- **Live Logging**: A toggleable console to view raw MQTT message data for easy debugging.

## 🛠️ How It Works

This project consists of a lightweight Express backend and a vanilla JavaScript frontend.

-   **Backend (Express.js & TypeScript)**:
    -   Connects securely to your MQTT broker.
    -   Subscribes to Tasmota's `stat/`, `tele/`, and `discovery` topics to listen for real-time state changes.
    -   Publishes commands to the `cmnd/` topic to control the bulb.
    -   Serves the frontend application and provides a simple, authenticated API for the client to fetch status and send commands.
    -   Uses **Zod** for robust and type-safe validation of all incoming API requests.
    -   Uses **Winston** for structured, detailed logging.

-   **Frontend (HTML, CSS, JS)**:
    -   A responsive, mobile-first single-page application built with **Tailwind CSS**.
    -   Communicates with the backend via a simple API.
    -   Features a service worker (`service-worker.js`) for PWA functionality and offline caching of assets.
    -   Dynamically updates the UI based on the latest device state received from the backend.

## 🚀 Getting Started

### Prerequisites

- A Tasmota-flashed smart bulb connected to your network.
- An MQTT broker (e.g., [HiveMQ](https://www.hivemq.com/), [Mosquitto](https://mosquitto.org/)).
- [Node.js](https://nodejs.org/) (v16 or higher) for local development.
- A [Vercel](https://vercel.com/) account for easy deployment.

### Environment Variables

Create a `.env` file in the root of your project or configure these directly in your Vercel project settings.

| Variable | Description | Example Value | Required |
| :--- | :--- | :--- | :--- |
| `API_KEY` | Secret key for dashboard login. | `MySecureSecretKey123` | **Yes** |
| `MQTT_HOST`| Address of your MQTT broker. | `your-id.s1.eu.hivemq.cloud`| **Yes** |
| `MQTT_PORT`| Port for your MQTT broker. | `8883` | **Yes** |
| `MQTT_USERNAME`| MQTT broker username. | `my-tasmota-user` | Optional |
| `MQTT_PASSWORD`| MQTT broker password. | `MyMQTTPassword` | Optional |
| `MQTT_PROTOCOL`| Connection protocol (`mqtts` or `mqtt`).| `mqtts` | **Yes** |
| `MQTT_TOPIC`| Base topic of your Tasmota device. | `tasmota_368072` | **Yes** |
| `TASMOTA_MAC`| MAC address of your device (no colons).| `40F520368072` | **Yes** |
| `PORT` | Port for the server (default: `3000`).| `3000` | Optional |

## ☁️ Deployment

### One-Click Vercel Deploy

The fastest way to get started is to click the button below and follow the on-screen instructions to clone this repository and deploy it to your Vercel account.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FWhoIsJayD%2Fcontrol-my-home-bulb&env=API_KEY,MQTT_HOST,MQTT_PORT,MQTT_USERNAME,MQTT_PASSWORD,MQTT_PROTOCOL,MQTT_TOPIC,TASMOTA_MAC&envDescription=Enter%20your%20project%20details.%20See%20README%20for%20more%20info.&project-name=my-bulb-control&repository-name=my-bulb-control)

### Manual Deployment

1.  Fork this repository and push it to your own GitHub account.
2.  Log in to Vercel and import your forked repository.
3.  Add the required **Environment Variables** listed above in the Vercel project settings.
4.  Deploy! You will get a custom URL for your new dashboard.

## 💻 Local Development

1.  **Clone the repository**:
    ```sh
    git clone https://github.com/WhoIsJayD/control-my-home-bulb.git
    cd control-my-home-bulb
    ```

2.  **Install dependencies**:
    ```sh
    npm install
    ```

3.  **Create a `.env` file** in the project root and add the environment variables from the table above.

4.  **Run the development server using Vercel CLI**:
    ```sh
    npm install -g vercel # If you don't have it
    vercel dev
    ```

5.  Open your browser to the URL provided (typically `http://localhost:3000`).

## 📱 Installing as a PWA

For quick access, you can install this dashboard as an app on your computer or mobile device.
1.  Open the dashboard's URL in a compatible browser (like Chrome, Edge, or Safari).
2.  Look for the "Install" icon in the address bar or the "Add to Home Screen" option in the browser menu.
3.  Follow the prompts to install. The app will be available on your home screen or in your app drawer.

## 🤝 Contributing

Contributions are welcome! If you have an idea for a new feature or have found a bug, please follow these steps:

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments
- [Tasmota](https://tasmota.github.io/docs/) for their incredible open-source firmware.
- [Vercel](https://vercel.com/) for their seamless deployment and hosting platform.
- The creators and maintainers of [Express.js](https://expressjs.com/), [MQTT.js](https://github.com/mqttjs/MQTT.js), [Zod](https://github.com/colinhacks/zod), and [Winston](https://github.com/winstonjs/winston).
