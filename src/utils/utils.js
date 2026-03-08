// Validates that a property value is a binary number (0 or 1)
const validateBinaryProperty = (key, val) => {
  if (val === null)
    throw new Error('Value for key "' + key + '" cannot be null.');
  if (val === undefined)
    throw new Error('Value for key "' + key + '" cannot be undefined.');
  if (typeof val !== 'number')
    throw new Error('Value for key "' + key + '" must be a number.');
  if (isNaN(val))
    throw new Error('Value for key "' + key + '" cannot be NaN.');
  if (!isFinite(val))
    throw new Error('Value for key "' + key + '" cannot be Infinity or -Infinity.');
  if (val !== 0 && val !== 1)
    throw new Error('Value for key "' + key + '" must be either 0 or 1.');
};

// Extracts binary vulnerability feature flags from a raw code string using regex
const extractFeatures = (code) => ({
  has_eval:             /\beval\s*\(/.test(code) ? 1 : 0,
  has_inner_html:       /\.innerHTML\s*=/.test(code) ? 1 : 0,
  has_document_write:   /document\.write\s*\(/.test(code) ? 1 : 0,
  has_sql:              /\b(SELECT\s+.+\s+FROM|INSERT\s+INTO|UPDATE\s+.+\s+SET|DELETE\s+FROM)\b/i.test(code) ? 1 : 0,
  has_exec:             /\b(exec|execSync|spawn|spawnSync)\s*\(/.test(code) ? 1 : 0,
  has_unvalidated_input:/req\.(body|params|query)\s*[\[.]/.test(code) ? 1 : 0,
  has_dynamic_import:   /require\s*\(\s*(?!['"`])/.test(code) || /import\s*\(\s*(?!['"`])/.test(code) ? 1 : 0,
  has_http_request:     /https?:\/\//.test(code) || /\b(fetch|axios\.(get|post|put|delete)|http\.get|https\.get)\s*\(/.test(code) ? 1 : 0,
});

// Generates additional training objects by creating random variations around a base risk/profile seed.
// Mirrors the pricecinerator-ai generateTrainingObjects pattern, adapted for binary features.
const generateTrainingObjects = (baseRisk, baseProfile, trainingData) => {
  const riskFluctuationFactor = 0.08;
  const newTrainingData = [];

  for (let i = 0; i < trainingData.length; i++) {
    const riskFluctuation =
      (Math.random() < 0.5 ? -1 : 1) * riskFluctuationFactor * Math.random();
    const randomRisk = Math.max(0.01, Math.min(0.99, baseRisk + riskFluctuation));

    // Occasionally borrow a feature value from existing training data for variation
    const randomIndex = Math.floor(Math.random() * trainingData.length);
    const randomInput = trainingData[randomIndex].input;

    const input = {};
    Object.keys(baseProfile).forEach((key) => {
      validateBinaryProperty(key, baseProfile[key]);
      const borrowed = randomInput[key] !== undefined ? randomInput[key] : baseProfile[key];
      // Use base profile value 85% of the time; borrow 15% of the time
      input[key] = Math.random() < 0.15 ? borrowed : baseProfile[key];
    });

    newTrainingData.push({ input, output: { risk: randomRisk } });
  }

  return newTrainingData;
};

module.exports = { validateBinaryProperty, extractFeatures, generateTrainingObjects };
