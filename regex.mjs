function convertCamelCaseInBracketsToSnakeCase(text) {
  return text.replace(/\(([^)]+)\)/g, function(match, p1) {
    // Convert camelCase to SNAKE_CASE within the brackets
    let snakeCase = p1.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
    return `(${snakeCase})`; // Return the modified text with brackets
  });
}

// Example usage
const inputText = "(exampleCamelCaseText)other text(exampleCamelCaseText)";
const outputText = convertCamelCaseInBracketsToSnakeCase(inputText);

console.log(outputText);
