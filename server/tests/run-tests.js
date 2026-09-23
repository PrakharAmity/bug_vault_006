const path = require('path');

async function runTests() {
  const serverDir = path.resolve(__dirname, '..');
  const expectedOrder = [
    "Bug 1: Sliding Window allows 6th request",
    "Bug 2: JWT expiry ignored",
    "Bug 3: IDOR profile access",
    "Bug 4: Plain text password authentication",
    "Bug 5: Pagination skips records",
    "Bug 6: Login attempt race condition"
  ];

  // Intercept stdout and stderr to eliminate ANY Jest verbose output or leaks
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);

  process.stdout.write = () => true;
  process.stderr.write = () => true;

  let jestResults;
  const startTime = Date.now();

  try {
    const { runCLI } = require('jest');
    const { results } = await runCLI(
      {
        config: path.resolve(serverDir, 'jest.config.js'),
        runInBand: true,
        silent: true,
        verbose: false,
        reporters: [], // Do not run default reporters during CLI execution
        _: []
      },
      [serverDir]
    );
    jestResults = results;
  } catch (err) {
    // If runCLI throws, we still output valid format
    jestResults = null;
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }

  const testMap = new Map();

  if (jestResults && jestResults.testResults) {
    for (const suite of jestResults.testResults) {
      if (suite.testResults) {
        for (const test of suite.testResults) {
          testMap.set(test.title, {
            Status: test.status,
            duration: Math.max(1, Math.round(test.duration || 5))
          });
        }
      }
    }
  }

  const output = {};
  let totalDuration = 0;
  let passedCount = 0;
  let failedCount = 0;

  for (const bugTitle of expectedOrder) {
    const item = testMap.get(bugTitle) || { Status: 'failed', duration: 8 };
    const duration = item.duration;
    totalDuration += duration;

    if (item.Status === 'passed') {
      passedCount++;
    } else {
      failedCount++;
    }

    output[bugTitle] = {
      Status: item.Status,
      "Execution time": `${duration}ms`
    };
  }

  output["Total bugs"] = expectedOrder.length;
  output["Passed"] = passedCount;
  output["Failed"] = failedCount;
  output["Total Execution time"] = `${totalDuration || (Date.now() - startTime)}ms`;

  // Output ONLY the JSON string
  process.stdout.write(JSON.stringify(output, null, 2) + '\n');

  // Exit with non-zero code because bugs fail
  process.exit(failedCount > 0 ? 1 : 0);
}

runTests();
