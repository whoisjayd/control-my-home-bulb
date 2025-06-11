# Tasmota MQTT Smart Bulb Dashboard

A robust, responsive, and self-hosted Progressive Web App (PWA) dashboard designed to control Tasmota-flashed smart bulbs via MQTT. This project is optimized for seamless one-click deployment on **Vercel**, providing a modern, intuitive interface to manage your smart lighting with real-time updates and comprehensive device information.

![Dashboard Screenshot](https://i.imgur.com/vIQ0ijk.png)

## ✨ Features

- **Real-Time Updates**: Utilizes HTTP polling to keep the dashboard synchronized with the bulb's current state, ensuring a responsive user experience.
- **Power Control**: Toggle the bulb on or off with a single click.
- **Color Temperature Adjustment**: Fine-tune white balance from warm (153 mired) to cool (500 mired) for perfect ambiance.
- **RGB Color Selection**: Choose any color using an intuitive hue slider for vibrant lighting effects.
- **Brightness Control**: Adjust brightness levels from 0% to 100% to suit your environment.
- **Device Information**: Monitor critical device details, including:
  - IP address
  - Hostname
  - Firmware version
  - Module type
  - Restart reason
  - Boot count
  - Wi-Fi status
- **Secure Authentication**: Requires an API key for access, configured via environment variables for enhanced security.
- **Responsive & PWA-Compatible**: Clean, mobile-friendly UI with offline support and the ability to install as a standalone app on desktop and mobile devices.
- **Live Logs**: Toggle a live log view to debug and monitor raw MQTT communication data in real time.
- **Error Handling**: Robust validation and error logging ensure reliable operation and easy troubleshooting.

## 🛠️ Technical Architecture

### Backend
- **Framework**: Built with [Express.js](https://expressjs.com/) for a lightweight and scalable server.
- **MQTT Communication**: Uses [MQTT.js](https://github.com/mqttjs/MQTT.js) to connect to an MQTT broker, subscribing to Tasmota’s `stat/`, `tele/`, and discovery topics for real-time updates and publishing to `cmnd/` topics for control.
- **Logging**: [Winston](https://github.com/winstonjs/winston) provides detailed logging with timestamped JSON output and colorized console logs for development.
- **Validation**: [Zod](https://github.com/colinhacks/zod) ensures safe parsing of API inputs for color temperature, brightness, and HSB color values.
- **Security**: API key-based authentication protects all control endpoints.

### Frontend
- **Static Assets**: Served from the `public` directory, including HTML, CSS, and JavaScript for a fast, client-side experience.
- **PWA Support**: Includes a service worker and manifest for offline functionality and app-like installation.
- **Responsive Design**: Built with modern CSS (e.g., Tailwind CSS or custom styles) for a consistent experience across devices.

### MQTT Integration
- Subscribes to:
  - `stat/<MQTT_TOPIC>/+` for device status updates (e.g., power, dimmer, color).
  - `tele/<MQTT_TOPIC>/+` for telemetry data (e.g., state, info).
  - `tasmota/discovery/<TASMOTA_MAC>/config` for device discovery.
- Publishes commands to `cmnd/<MQTT_TOPIC>/<COMMAND>` for controlling power, color temperature, brightness, and HSB color.

## 🚀 Getting Started

### Prerequisites
- A Tasmota-flashed smart bulb configured with your MQTT broker.
- An MQTT broker (e.g., [HiveMQ](https://www.hivemq.com/), [Mosquitto](https://mosquitto.org/)).
- [Node.js](https://nodejs.org/) (v16 or higher) for local development.
- A [Vercel](https://vercel.com/) account for deployment.

### Environment Variables
Configure the following variables in your Vercel project settings or in a `.env` file in the project root for local development:

| Variable          | Description                                           | Example Value                | Required |
|-------------------|-------------------------------------------------------|------------------------------|----------|
| `API_KEY`         | Secret key for dashboard login authentication.         | `MySecureSecretKey123`       | Yes      |
| `MQTT_HOST`       | Address of your MQTT broker.                          | `your-id.s1.eu.hivemq.cloud` | Yes      |
| `MQTT_PORT`       | MQTT broker port (e.g., `8883` for MQTTS).            | `8883`                       | Yes      |
| `MQTT_USERNAME`   | MQTT broker username.                                 | `my-tasmota-user`            | Optional |
| `MQTT_PASSWORD`   | MQTT broker password.                                 | `MyMQTTPassword`             | Optional |
| `MQTT_PROTOCOL`   | Protocol (`mqtts` for secure, or `mqtt`).             | `mqtts`                      | Yes      |
| `MQTT_TOPIC`      | Base topic of your Tasmota device.                    | `tasmota_368072`             | Yes      |
| `TASMOTA_MAC`     | MAC address of your Tasmota device (no colons).       | `40F520368072`               | Yes      |
| `PORT`            | Port for the Express server (default: `3000`).        | `3000`                       | Optional |

**Example `.env` file**:
```env
API_KEY=MySecureSecretKey123
MQTT_HOST=your-id.s1.eu.hivemq.cloud
MQTT_PORT=8883
MQTT_USERNAME=my-tasmota-user
MQTT_PASSWORD=MyMQTTPassword
MQTT_PROTOCOL=mqtts
MQTT_TOPIC=tasmota_368072
TASMOTA_MAC=40F520368072
PORT=3000
```

### Deployment on Vercel
1. **Clone the repository**:
   ```sh
   git clone https://github.com/WhoIsJayD/control-my-home-bulb
   cd control-my-home-bulb
   ```

2. **Push to GitHub**:
   - Create a new repository on GitHub.
   - Push the project to your repository:
     ```sh
     git remote add origin <your-repo-url>
     git push -u origin main
     ```

3. **Deploy to Vercel**:
   - Log in to your Vercel account.
   - Import the GitHub repository via the Vercel dashboard.
   - Add the environment variables listed above in the Vercel project settings.
   - Deploy the project.
   - Access the dashboard at the provided Vercel URL (e.g., `https://your-project.vercel.app`).

### Local Development
1. **Clone the repository**:
   ```sh
   git clone https://github.com/WhoIsJayD/control-my-home-bulb
   cd control-my-home-bulb
   ```

2. **Install Vercel CLI**:
   ```sh
   npm install -g vercel
   ```

3. **Install dependencies**:
   ```sh
   npm install
   ```

4. **Create a `.env` file** in the project root with the environment variables listed above.

5. **Run the development server**:
   ```sh
   vercel dev
   ```

6. Open the dashboard in your browser at the provided URL (typically `http://localhost:3000`).

### Installing as a PWA
- Open the dashboard in a PWA-compatible browser (e.g., Chrome, Edge, Safari).
- Look for the "Add to Home Screen" or "Install App" prompt in the browser.
- Follow the prompts to install the dashboard as a standalone app on your mobile or desktop device.
- The PWA supports offline access for cached assets, ensuring a smooth experience even with limited connectivity.


## 🤝 Contributing
We welcome contributions to enhance the dashboard! To contribute:

1. **Fork the repository** on GitHub.
2. **Create a feature branch**:
   ```sh
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**:
   ```sh
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**:
   ```sh
   git push origin feature/AmazingFeature
   ```
5. **Open a pull request** on GitHub, describing your changes in detail.


## 📜 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments
- [Tasmota](https://tasmota.github.io/docs/) for providing open-source firmware for smart devices.
- [Vercel](https://vercel.com/) for seamless deployment and hosting.
- [MQTT.js](https://github.com/mqttjs/MQTT.js) for reliable MQTT communication.
- [Express.js](https://expressjs.com/) for a robust backend framework.
- [Winston](https://github.com/winstonjs/winston) for comprehensive logging.
- [Zod](https://github.com/colinhacks/zod) for type-safe input validation.

## 📞 Support
For issues, questions, or feature requests, please:
- Open an issue on the [GitHub repository](https://github.com/WhoIsJayD/control-my-home-bulb).
- Reach out to the community via GitHub Discussions or relevant Tasmota forums.