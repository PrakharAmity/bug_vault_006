class CustomJsonReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(testContexts, results) {
    const expectedOrder = [
      "Bug 1: Sliding Window allows 6th request",
      "Bug 2: JWT expiry ignored",
      "Bug 3: IDOR profile access",
      "Bug 4: Plain text password authentication",
      "Bug 5: Pagination skips records",
      "Bug 6: Login attempt race condition"
    ];

    const testMap = new Map();

    if (results && results.testResults) {
      for (const suite of results.testResults) {
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
      const item = testMap.get(bugTitle) || { Status: 'failed', duration: 10 };
      const durationMs = item.duration;
      totalDuration += durationMs;

      if (item.Status === 'passed') {
        passedCount++;
      } else {
        failedCount++;
      }

      output[bugTitle] = {
        Status: item.Status,
        "Execution time": `${durationMs}ms`
      };
    }

    output["Total bugs"] = expectedOrder.length;
    output["Passed"] = passedCount;
    output["Failed"] = failedCount;
    output["Total Execution time"] = `${totalDuration}ms`;

    process.stdout.write(JSON.stringify(output, null, 2) + '\n');
  }
}

module.exports = CustomJsonReporter;
