const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'"],
    },
  },
}));

// CORS configuration for Next.js frontend
app.use(cors({
  origin: [
    'http://localhost:3001', // Next.js dev server
    'http://localhost:3000', // Alternative port
    'http://localhost:3002', // Alternative port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

let icdCodes = [];
let icdDescriptions = [];

// Initialization tracking
let initializationStatus = {
  status: 'not_started', // 'not_started', 'in_progress', 'completed', 'failed'
  progress: 0,
  message: 'System not initialized',
  startTime: null,
  endTime: null,
  error: null,
  steps: []
};

let initializationProcess = null;

const loadIcdData = async () => {
  try {
    const codesData = await fs.readFile(path.join(__dirname, 'icd10_kb', 'icd_codes_3.json'), 'utf8');
    const descriptionsData = await fs.readFile(path.join(__dirname, 'icd10_kb', 'icd_descriptions_3.json'), 'utf8');

    icdCodes = JSON.parse(codesData);
    icdDescriptions = JSON.parse(descriptionsData);

    console.log(`✅ Loaded ${icdCodes.length} ICD-10 codes for reference`);
  } catch (error) {
    console.log('⚠️  ICD data files not found - will be created on first mapping request');
  }
};

const findPythonCommand = () => {
  // On Windows, try py first (Python launcher), then python3, then python
  const commands = process.platform === 'win32' ? ['py', 'python3', 'python'] : ['python3', 'python'];
  return commands[0]; // For now, use the first option, can be made more robust
};

const runPythonMapperWithProgress = (diagnoses, progressCallback = null, timeout = 600000) => {
  return new Promise((resolve, reject) => {
    const pythonArgs = Array.isArray(diagnoses) ? diagnoses : [diagnoses];
    const pythonCmd = findPythonCommand();

    console.log(`Running Python command: ${pythonCmd} icd10_mapper.py ${pythonArgs.join(' ')}`);
    const pythonProcess = spawn(pythonCmd, ['icd10_mapper.py', ...pythonArgs], { cwd: __dirname });

    let stdout = '';
    let stderr = '';
    let currentStep = '';

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;

      // Parse progress from Python output
      if (progressCallback) {
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.includes('Initializing ICD-10 mapping system')) {
            progressCallback(10, 'Initializing ICD-10 mapping system...');
          } else if (line.includes('Setting up ICD-10 data')) {
            progressCallback(20, 'Setting up ICD-10 data...');
          } else if (line.includes('ICD-10 metadata processed')) {
            progressCallback(40, 'ICD-10 metadata processed');
          } else if (line.includes('Creating embedding index')) {
            progressCallback(50, 'Creating embedding index (this may take several minutes)...');
          } else if (line.includes('Downloading Sentence-BERT model')) {
            progressCallback(30, 'Downloading ML model (first-time setup, may take 10-20 minutes)...');
          } else if (line.includes('Model loaded successfully')) {
            progressCallback(45, 'Model downloaded successfully. Creating embeddings...');
          } else if (line.includes('Batches:')) {
            // Parse batch progress: "Batches:   3%|3         | 89/2942"
            const batchMatch = line.match(/Batches:\s*(\d+)%/);
            if (batchMatch) {
              const batchProgress = parseInt(batchMatch[1]);
              const overallProgress = 50 + Math.floor(batchProgress * 0.4); // 50-90% for batches
              progressCallback(overallProgress, `Processing embeddings: ${batchProgress}% (${line.split('|').pop()?.trim() || ''})`);
            }
          } else if (line.includes('FAISS index created')) {
            progressCallback(95, 'FAISS index created successfully');
          } else if (line.includes('System initialized successfully')) {
            progressCallback(100, 'System initialized successfully');
          }
        }
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      clearTimeout(timeoutId);

      if (code !== 0) {
        reject(new Error(`Python script failed with code ${code}. Command: ${pythonCmd}. Error: ${stderr}`));
        return;
      }

      try {
        const lines = stdout.trim().split('\n');
        let jsonOutput = '';
        let startJson = false;

        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            startJson = true;
          }
          if (startJson) {
            jsonOutput += line + '\n';
          }
        }

        if (jsonOutput.trim()) {
          const result = JSON.parse(jsonOutput);
          resolve(result);
        } else {
          reject(new Error('No JSON output from Python script'));
        }
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${error.message}\nOutput: ${stdout}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });

    // Set timeout
    const timeoutId = setTimeout(() => {
      pythonProcess.kill();
      reject(new Error(`Python script timed out after ${timeout/1000} seconds. This may be due to first-time model download.`));
    }, timeout);
  });
};

const runPythonMapper = (diagnoses, timeout = 300000) => {
  return runPythonMapperWithProgress(diagnoses, null, timeout);
};

app.get('/', (req, res) => {
  res.json({
    message: 'ICD-10 Code Mapping API',
    version: '1.0.0',
    description: 'API that uses Python hybrid keyword + semantic search for ICD-10 mapping',
    endpoints: {
      'POST /api/initialize': 'Start background initialization (returns immediately with task ID)',
      'GET /api/initialize/status': 'Check initialization progress and status',
      'POST /api/map': 'Map a single diagnosis to ICD-10 code',
      'POST /api/map/batch': 'Map multiple diagnoses to ICD-10 codes',
      'GET /api/codes': 'Get all available ICD-10 codes',
      'GET /api/search?q=query': 'Search ICD-10 codes by description'
    },
    note: 'Run POST /api/initialize first to set up the system. This may take 5-10 minutes on first run.'
  });
});

app.post('/api/initialize', async (req, res) => {
  try {
    // Check if initialization is already in progress
    if (initializationStatus.status === 'in_progress') {
      return res.json({
        message: 'Initialization already in progress',
        status: initializationStatus.status,
        progress: initializationStatus.progress,
        current_step: initializationStatus.message,
        started_at: initializationStatus.startTime
      });
    }

    // Check if already completed
    if (initializationStatus.status === 'completed') {
      return res.json({
        message: 'System already initialized',
        status: 'completed',
        progress: 100,
        completed_at: initializationStatus.endTime,
        duration: initializationStatus.endTime - initializationStatus.startTime
      });
    }

    // Start initialization
    initializationStatus = {
      status: 'in_progress',
      progress: 0,
      message: 'Starting initialization...',
      startTime: Date.now(),
      endTime: null,
      error: null,
      steps: []
    };

    console.log('🚀 Starting background system initialization...');

    // Start initialization in background
    const progressCallback = (progress, message) => {
      initializationStatus.progress = progress;
      initializationStatus.message = message;
      initializationStatus.steps.push({
        timestamp: Date.now(),
        progress,
        message
      });
      console.log(`Init Progress: ${progress}% - ${message}`);
    };

    // Run initialization in background (don't await)
    runPythonMapperWithProgress(['test'], progressCallback, 1800000) // 30 minute timeout for first-time model download
      .then(result => {
        initializationStatus.status = 'completed';
        initializationStatus.progress = 100;
        initializationStatus.message = 'System initialized successfully!';
        initializationStatus.endTime = Date.now();
        console.log('✅ Background initialization completed successfully');
      })
      .catch(error => {
        initializationStatus.status = 'failed';
        initializationStatus.error = error.message;
        initializationStatus.message = 'Initialization failed: ' + error.message;
        initializationStatus.endTime = Date.now();
        console.error('❌ Background initialization failed:', error.message);
      });

    // Return immediately
    res.json({
      message: 'Initialization started in background',
      status: 'in_progress',
      progress: 0,
      started_at: initializationStatus.startTime,
      estimated_duration: '5-15 minutes (depends on internet speed and hardware)',
      check_status_url: '/api/initialize/status'
    });
  } catch (error) {
    console.error('❌ Failed to start initialization:', error.message);
    res.status(500).json({
      error: 'Failed to start initialization',
      details: error.message
    });
  }
});

app.get('/api/initialize/status', (req, res) => {
  const response = {
    status: initializationStatus.status,
    progress: initializationStatus.progress,
    message: initializationStatus.message,
    started_at: initializationStatus.startTime,
    completed_at: initializationStatus.endTime
  };

  if (initializationStatus.status === 'completed' && initializationStatus.startTime && initializationStatus.endTime) {
    response.duration_ms = initializationStatus.endTime - initializationStatus.startTime;
    response.duration_minutes = Math.round((initializationStatus.endTime - initializationStatus.startTime) / 60000 * 10) / 10;
  }

  if (initializationStatus.error) {
    response.error = initializationStatus.error;
  }

  if (req.query.include_steps === 'true') {
    response.steps = initializationStatus.steps;
  }

  res.json(response);
});

app.post('/api/map', async (req, res) => {
  try {
    const { diagnosis } = req.body;

    if (!diagnosis) {
      return res.status(400).json({
        error: 'Missing required field: diagnosis'
      });
    }

    if (typeof diagnosis !== 'string' || diagnosis.trim().length === 0) {
      return res.status(400).json({
        error: 'Diagnosis must be a non-empty string'
      });
    }

    console.log(`🔍 Mapping diagnosis: "${diagnosis}"`);
    const result = await runPythonMapper([diagnosis]);

    if (result.results && result.results.length > 0) {
      res.json(result.results[0]);
    } else {
      res.json({
        original_diagnosis: diagnosis,
        matched_icd_code: null,
        matched_description: null,
        confidence_level: 'No Match',
        justification: 'No suitable ICD-10 code found for this diagnosis',
        alternative_codes: ''
      });
    }
  } catch (error) {
    console.error('❌ Error in /api/map:', error.message);
    res.status(500).json({
      error: 'Failed to process diagnosis mapping',
      details: error.message
    });
  }
});

app.post('/api/map/batch', async (req, res) => {
  try {
    const { diagnoses } = req.body;

    if (!diagnoses || !Array.isArray(diagnoses)) {
      return res.status(400).json({
        error: 'Missing required field: diagnoses (must be an array)'
      });
    }

    if (diagnoses.length > 100) {
      return res.status(400).json({
        error: 'Maximum 100 diagnoses allowed per batch request'
      });
    }

    if (diagnoses.length === 0) {
      return res.status(400).json({
        error: 'Diagnoses array cannot be empty'
      });
    }

    // Validate all diagnoses are strings
    for (let i = 0; i < diagnoses.length; i++) {
      if (typeof diagnoses[i] !== 'string' || diagnoses[i].trim().length === 0) {
        return res.status(400).json({
          error: `Diagnosis at index ${i} must be a non-empty string`
        });
      }
    }

    console.log(`🔍 Mapping ${diagnoses.length} diagnoses`);
    const result = await runPythonMapper(diagnoses);
    res.json(result);
  } catch (error) {
    console.error('❌ Error in /api/map/batch:', error.message);
    res.status(500).json({
      error: 'Failed to process batch diagnosis mapping',
      details: error.message
    });
  }
});

app.get('/api/codes', (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  const start = parseInt(offset);
  const end = start + parseInt(limit);

  const codes = icdCodes.slice(start, end).map((code, index) => ({
    code,
    description: icdDescriptions[start + index]
  }));

  res.json({
    total: icdCodes.length,
    limit: parseInt(limit),
    offset: start,
    codes
  });
});

app.get('/api/search', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Missing required query parameter: q',
        example: '/api/search?q=diabetes&limit=10'
      });
    }

    if (query.trim().length < 2) {
      return res.status(400).json({
        error: 'Query must be at least 2 characters long'
      });
    }

    console.log(`🔍 Searching for: "${query}"`);

    // Use Python mapper to search for the query
    const result = await runPythonMapper([query]);

    if (result.results && result.results.length > 0) {
      const mappingResult = result.results[0];

      // Return search-style results based on the mapping
      const searchResults = [{
        code: mappingResult.matched_icd_code,
        description: mappingResult.matched_description,
        match_type: mappingResult.confidence_level,
        justification: mappingResult.justification
      }];

      // Add alternatives if available
      if (mappingResult.alternative_codes && mappingResult.alternative_codes.trim()) {
        const alternatives = mappingResult.alternative_codes.split(', ').map(alt => {
          const match = alt.match(/([A-Z]\d+(?:\.\d+)*)/);
          return match ? { code: match[1], description: 'Alternative match' } : null;
        }).filter(Boolean);

        searchResults.push(...alternatives.slice(0, parseInt(limit) - 1));
      }

      res.json({
        query,
        total_results: searchResults.length,
        results: searchResults.slice(0, parseInt(limit))
      });
    } else {
      res.json({
        query,
        total_results: 0,
        results: []
      });
    }
  } catch (error) {
    console.error('❌ Error in /api/search:', error.message);
    res.status(500).json({
      error: 'Failed to search ICD-10 codes',
      details: error.message
    });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: ['/api/initialize', '/api/map', '/api/map/batch', '/api/codes', '/api/search']
  });
});

app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    error: 'Internal server error'
  });
});

const startServer = async () => {
  await loadIcdData();

  app.listen(PORT, () => {
    console.log(`🚀 ICD-10 Mapping API running on port ${PORT}`);
    console.log(`📖 API Documentation: http://localhost:${PORT}`);
    console.log(`🐍 Using Python script for ICD-10 mapping with hybrid keyword + semantic search`);
    console.log(`📊 Supports: keyword matching, semantic search with Sentence-BERT, and FAISS indexing`);
  });
};

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});