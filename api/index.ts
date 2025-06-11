import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mqtt, { MqttClient } from 'mqtt';
import winston from 'winston';
import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

// --- CONFIGURATION ---
const config = {
  apiKey: process.env.API_KEY || 'default-secret-key-please-change',
  mqtt: {
    host: process.env.MQTT_HOST,
    port: parseInt(process.env.MQTT_PORT || '8883'),
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    protocol: (process.env.MQTT_PROTOCOL as 'mqtts' | 'mqtt') || 'mqtts',
    defaultTopic: process.env.MQTT_TOPIC,
  },
  port: parseInt(process.env.PORT || '3000'),
  tasmotaMac: process.env.TASMOTA_MAC,
};

const discoveryTopic = `tasmota/discovery/${config.tasmotaMac}/config`;

// --- LOGGER ---
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

// --- VALIDATION SCHEMAS ---
const ctSchema = z.object({ value: z.number().min(153).max(500) });
const dimmerSchema = z.object({ value: z.number().min(0).max(100) });
const hsbSchema = z.object({
  hue: z.number().min(0).max(360),
  saturation: z.number().min(0).max(100),
  dimmer: z.number().min(0).max(100),
});

// --- DEVICE STATE ---
const deviceState = {
  power: 'OFF' as 'ON' | 'OFF',
  online: false,
  ip: 'N/A',
  hostname: 'N/A',
  module: 'N/A',
  version: 'N/A',
  restartReason: 'N/A',
  bootCount: 0,
  dimmer: 10,
  color: '0,0,0',
  hsbColor: '0,0,0',
  ct: 153,
  wifi: {} as Record<string, any>,
};

// --- MQTT SETUP ---
if (!config.mqtt.host || !config.mqtt.defaultTopic || !config.tasmotaMac) {
  logger.error('FATAL: MQTT configuration is incomplete. Check MQTT_HOST, MQTT_TOPIC, and TASMOTA_MAC in your environment variables.');
  process.exit(1);
}

const client: MqttClient = mqtt.connect(`${config.mqtt.protocol}://${config.mqtt.host}`, {
  port: config.mqtt.port,
  username: config.mqtt.username,
  password: config.mqtt.password,
  reconnectPeriod: 5000,
  keepalive: 60,
});

client.on('connect', () => {
  logger.info('Connected to MQTT broker');
  const topics = [
    `stat/${config.mqtt.defaultTopic}/+`,
    `tele/${config.mqtt.defaultTopic}/+`,
    discoveryTopic,
  ];
  client.subscribe(topics, { qos: 1 }, (err) => {
    if (err) logger.error(`Subscription error:`, err);
    else logger.info(`Subscribed to topics: ${topics.join(', ')}`);
  });
});

client.on('message', (topic: string, message: Buffer) => {
  const msgStr = message.toString();
  logger.debug(`MQTT Rx: ${topic} -> ${msgStr}`);

  try {
    const isJson = msgStr.startsWith('{');
    const payload = isJson ? JSON.parse(msgStr) : msgStr;
    const topicParts = topic.split('/');

    if (topic.endsWith('/LWT')) {
      deviceState.online = payload === 'Online';
      if (!deviceState.online) logger.warn('Device went offline (LWT).');
    } else if (topic.endsWith('/STATE')) {
      Object.assign(deviceState, { ...payload, online: true });
    } else if (topic.endsWith('/RESULT')) {
        if(payload.POWER) deviceState.power = payload.POWER;
        if(payload.Dimmer) deviceState.dimmer = payload.Dimmer;
        if(payload.CT) deviceState.ct = payload.CT;
        if(payload.HSBColor) deviceState.hsbColor = payload.HSBColor;
    } else if (topic.endsWith('/INFO1')) {
      Object.assign(deviceState, { module: payload.Module, version: payload.Version });
    } else if (topic.endsWith('/INFO2')) {
      Object.assign(deviceState, { hostname: payload.Hostname, ip: payload.IPAddress });
    } else if (topic.endsWith('/INFO3')) {
      Object.assign(deviceState, { restartReason: payload.RestartReason, bootCount: payload.BootCount });
    } else if (topic === discoveryTopic) {
      Object.assign(deviceState, { ip: payload.ip, hostname: payload.hn, module: payload.md, version: payload.sw });
    }
  } catch (err) {
    logger.error(`Error processing MQTT message from topic ${topic}:`, err);
  }
});

client.on('error', (err) => logger.error('MQTT Client Error:', err));
client.on('close', () => logger.warn('MQTT connection closed'));

const publishCommand = (command: string, value: string) => {
  const topic = `cmnd/${config.mqtt.defaultTopic}/${command}`;
  client.publish(topic, value, { qos: 1 }, (err) => {
    if (err) logger.error(`Failed to publish to ${topic}:`, err);
    else logger.info(`MQTT Tx: ${topic} -> ${value}`);
  });
};

// --- EXPRESS APP ---
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- API ROUTES ---
const apiRouter = express.Router();

// Authentication middleware
const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.body.apiKey || req.query.apiKey;
  if (apiKey !== config.apiKey) {
    logger.warn(`Failed authentication attempt from IP: ${req.ip}`);
    res.status(401).json({ success: false, error: 'Invalid API key' });
    return;
  }
  next();
};

apiRouter.post('/login', (req: Request, res: Response) => {
    const apiKey = req.body.apiKey || req.query.apiKey;
  
  if (apiKey === config.apiKey) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid API key' });
  }
});

apiRouter.use(authenticate); // All routes below this point are protected

apiRouter.get('/status', (req: Request, res: Response) => {
  res.json(deviceState);
});

apiRouter.post('/control/power', (req: Request, res: Response) => {
  const newState = deviceState.power === 'ON' ? 'OFF' : 'ON';
  publishCommand('POWER', newState);
  deviceState.power = newState; // Optimistic update
  res.json(deviceState);
});

apiRouter.post('/control/ct', (req: Request, res: Response) => {
  try {
    const { value } = ctSchema.parse(req.body);
    publishCommand('CT', value.toString());
    deviceState.ct = value; // Optimistic update
    res.json(deviceState);
  } catch (error) {
    res.status(400).json({ success: false, error: 'Invalid CT value' });
  }
});

apiRouter.post('/control/dimmer', (req: Request, res: Response) => {
  try {
    const { value } = dimmerSchema.parse(req.body);
    publishCommand('Dimmer', value.toString());
    deviceState.dimmer = value; // Optimistic update
    res.json(deviceState);
  } catch (error) {
    res.status(400).json({ success: false, error: 'Invalid dimmer value' });
  }
});

apiRouter.post('/control/hsb', (req: Request, res: Response) => {
  try {
    const { hue, saturation, dimmer } = hsbSchema.parse(req.body);
    const hsbValue = `${hue},${saturation},${dimmer}`;
    publishCommand('HSBColor', hsbValue);
    deviceState.hsbColor = hsbValue; // Optimistic update
    res.json(deviceState);
  } catch (error) {
    res.status(400).json({ success: false, error: 'Invalid HSB values' });
  }
});

app.use('/api', apiRouter);

// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
// });

app.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port}`);
});

export default app;
