const brain = require('brain.js');
const {
  scanNeuralNetworkConfig,
  scanTrainingOptions,
  riskThresholds,
  objectGenerationOptions,
} = require('./constants/settings');
const { scanTrainingData } = require('./constants/trainingData');
const { validateBinaryProperty, extractFeatures, generateTrainingObjects } = require('./utils/utils');

let neuralNetwork = null;

// Trains the neural network on startup using base training data + generated augmentation
const initializeNeuralNetwork = () => {
  const net = new brain.NeuralNetwork(scanNeuralNetworkConfig);
  const trainingData = scanTrainingData.slice();

  // Validate all base training data inputs before use
  trainingData.forEach(({ input }) => {
    Object.keys(input).forEach((key) => validateBinaryProperty(key, input[key]));
  });

  // Augment training data from generation seeds (mirrors pricecinerator-ai pattern)
  for (const [baseRisk, baseProfile] of objectGenerationOptions) {
    const generated = generateTrainingObjects(baseRisk, baseProfile, trainingData);
    trainingData.push(...generated);
  }

  net.train(trainingData, scanTrainingOptions);
  neuralNetwork = net;
};

/**
 * Extracts vulnerability features from raw code and runs the neural network
 * to produce a risk score, percentage, label, and the detected feature flags.
 *
 * @param {string} code - Raw source code string to scan
 * @returns {{ risk: number, riskPercent: number, label: string, features: object }}
 */
const runScan = (code) => {
  if (!neuralNetwork) throw new Error('Neural network not initialized.');

  const features = extractFeatures(code);
  const output = neuralNetwork.run(features);
  const risk = output.risk;
  const riskPercent = Math.round(risk * 100);

  let label;
  if (riskPercent < riskThresholds.low * 100)    label = 'Low Risk';
  else if (riskPercent < riskThresholds.medium * 100) label = 'Medium Risk';
  else if (riskPercent < riskThresholds.high * 100)   label = 'High Risk';
  else                                                 label = 'Critical Risk';

  return { risk, riskPercent, label, features };
};

module.exports = { initializeNeuralNetwork, runScan };
