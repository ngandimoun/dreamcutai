// Test script to verify error handling and bug reporting system
const { getUserFriendlyError } = require('./lib/manim/error-messages.ts');

// Test various error scenarios
const testErrors = [
  {
    name: "PieChart Error",
    error: "NameError: name 'PieChart' is not defined",
    expectedCategory: "api",
    expectedSeverity: "warning"
  },
  {
    name: "Camera Frame Error", 
    error: "AttributeError: 'Camera' object has no attribute 'frame'",
    expectedCategory: "api",
    expectedSeverity: "info"
  },
  {
    name: "LaTeX Error",
    error: "LaTeX Error: Missing $ inserted",
    expectedCategory: "math", 
    expectedSeverity: "warning"
  },
  {
    name: "Memory Error",
    error: "MemoryError: Unable to allocate array",
    expectedCategory: "memory",
    expectedSeverity: "critical"
  },
  {
    name: "VGroup Type Error",
    error: "TypeError: All submobjects of VGroup must be of type VMobject. Got Mobject (Mobject) instead.",
    expectedCategory: "api",
    expectedSeverity: "warning"
  },
  {
    name: "Timeout Error",
    error: "TimeoutError: Animation took too long to render",
    expectedCategory: "timeout",
    expectedSeverity: "critical"
  },
  {
    name: "Unknown Error",
    error: "Some random error that doesn't match any pattern",
    expectedCategory: "animation",
    expectedSeverity: "warning"
  }
];

console.log("🧪 Testing Error Handling System\n");

testErrors.forEach((test, index) => {
  console.log(`${index + 1}. Testing: ${test.name}`);
  console.log(`   Error: ${test.error}`);
  
  try {
    const result = getUserFriendlyError(test.error);
    console.log(`   ✅ Message: ${result.message}`);
    console.log(`   💡 Suggestion: ${result.suggestion}`);
    console.log(`   📊 Category: ${result.category} (expected: ${test.expectedCategory})`);
    console.log(`   ⚠️  Severity: ${result.severity} (expected: ${test.expectedSeverity})`);
    
    // Verify expectations
    if (result.category === test.expectedCategory && result.severity === test.expectedSeverity) {
      console.log(`   ✅ PASS - Category and severity match expectations\n`);
    } else {
      console.log(`   ❌ FAIL - Category or severity mismatch\n`);
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }
});

console.log("🎯 Error Handling Test Complete!");

