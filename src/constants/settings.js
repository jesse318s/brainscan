//----------------------
// Global Settings
//----------------------

// Delay in ms before running the neural network (reserved for future use)
const scanTimeoutDelay = 200;

// Risk classification thresholds
const riskThresholds = {
  low: 0.2,
  medium: 0.5,
  high: 0.75,
};

// Object generation: [baseRisk, baseFeatureProfile] seed pairs for training data augmentation
const objectGenerationOptions = new Map([
  [
    0.02,
    {
      has_eval: 0,
      has_inner_html: 0,
      has_document_write: 0,
      has_sql: 0,
      has_exec: 0,
      has_unvalidated_input: 0,
      has_dynamic_import: 0,
      has_http_request: 0,
    },
  ],
  [
    0.55,
    {
      has_eval: 0,
      has_inner_html: 1,
      has_document_write: 0,
      has_sql: 0,
      has_exec: 0,
      has_unvalidated_input: 1,
      has_dynamic_import: 0,
      has_http_request: 0,
    },
  ],
  [
    0.92,
    {
      has_eval: 1,
      has_inner_html: 1,
      has_document_write: 0,
      has_sql: 1,
      has_exec: 1,
      has_unvalidated_input: 1,
      has_dynamic_import: 0,
      has_http_request: 0,
    },
  ],
]);

//----------------------
// Neural Network Settings
//----------------------
const scanNeuralNetworkConfig = {
  hiddenLayers: [8, 4], // Number of neurons in each hidden layer
  inputSize: 8,         // Number of input neurons (binary feature flags)
  outputSize: 1,        // Number of output neurons (risk score)
  hiddenLayerActivation: 'relu', // Activation function for hidden layers
};

const scanTrainingOptions = {
  iterations: 20000,    // Maximum training iterations
  timeout: 25000,       // Maximum training time in milliseconds
  learningRate: 0.5,    // How much to shift weights each iteration
  decayRate: 0.5,       // Learning rate decay over time
  momentum: 0.1,        // Influence of previous iterations on current
  errorThresh: 0.005,   // Error threshold to complete training early
  minimize: true,       // Minimize the error function
  log: true,            // Log progress to console
  logPeriod: 5000,      // Iterations between logs
};

module.exports = {
  scanTimeoutDelay,
  riskThresholds,
  objectGenerationOptions,
  scanNeuralNetworkConfig,
  scanTrainingOptions,
};
