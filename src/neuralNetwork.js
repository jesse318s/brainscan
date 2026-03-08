// Require NeuralNetwork directly from the vendored dist to avoid pulling in
// the GPU backend (gpu.js requires native compilation via node-gyp).
const NeuralNetwork = require('../vendor/brain.js/dist/neural-network').default;
const fs = require('fs');
const path = require('path');
const {
  scanNeuralNetworkConfig,
  scanTrainingOptions,
  riskThresholds,
  objectGenerationOptions,
} = require('./constants/settings');
const { scanTrainingData } = require('./constants/trainingData');
const { validateBinaryProperty, extractFeatures, generateTrainingObjects } = require('./utils/utils');

let neuralNetwork = null;

const SNAPSHOT_PATH = path.join(__dirname, '..', 'data', 'trained-network.json');

// Saves the trained network weights to disk for self-replication / fast restart
const saveSnapshot = (net) => {
  const dir = path.dirname(SNAPSHOT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(net.toJSON()), 'utf8');
};

// Trains from scratch, saves a snapshot, and returns the network
const trainNetwork = () => {
  const net = new NeuralNetwork(scanNeuralNetworkConfig);
  const trainingData = scanTrainingData.slice();

  trainingData.forEach(({ input }) => {
    Object.keys(input).forEach((key) => validateBinaryProperty(key, input[key]));
  });

  for (const [baseRisk, baseProfile] of objectGenerationOptions) {
    const generated = generateTrainingObjects(baseRisk, baseProfile, trainingData);
    trainingData.push(...generated);
  }

  net.train(trainingData, scanTrainingOptions);
  saveSnapshot(net);
  return net;
};

// On startup: load saved snapshot if available, otherwise train fresh.
// Self-replication: the saved snapshot lets the project reproduce its trained
// state exactly on any machine with just the source files + vendor dir.
const initializeNeuralNetwork = () => {
  if (fs.existsSync(SNAPSHOT_PATH)) {
    console.log('Loading saved neural network snapshot from data/trained-network.json...');
    const net = new NeuralNetwork(scanNeuralNetworkConfig);
    net.fromJSON(JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8')));
    neuralNetwork = net;
    console.log('Neural network loaded.');
  } else {
    console.log('No snapshot found. Training neural network from scratch...');
    neuralNetwork = trainNetwork();
    console.log('Neural network trained and snapshot saved to data/trained-network.json');
  }
};

const retrainNeuralNetwork = () => {
  console.log('Retraining neural network...');
  neuralNetwork = trainNetwork();
  console.log('Retrain complete. Snapshot updated.');
};

const runScan = (code) => {
  if (!neuralNetwork) throw new Error('Neural network not initialized.');

  const features = extractFeatures(code);
  const output = neuralNetwork.run(features);
  const risk = output.risk;
  const riskPercent = Math.round(risk * 100);

  let label;
  if (riskPercent < riskThresholds.low * 100)         label = 'Low Risk';
  else if (riskPercent < riskThresholds.medium * 100)  label = 'Medium Risk';
  else if (riskPercent < riskThresholds.high * 100)    label = 'High Risk';
  else                                                  label = 'Critical Risk';

  return { risk, riskPercent, label, features };
};

module.exports = { initializeNeuralNetwork, retrainNeuralNetwork, runScan };

