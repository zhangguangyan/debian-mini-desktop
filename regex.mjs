function convertCamelCaseInBracketsToSnakeCase(text) {
  return text.replace(/\(([^)]+)\)/g, function(match, p1) {
    // Convert camelCase and transitions involving digits to SNAKE_CASE within the brackets
    let snakeCase = p1.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
                      .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
                      .toUpperCase();
    return `(${snakeCase})`; // Return the modified text with brackets
  });
}

// Example usage
const inputText = "(exampleCamelCaseText1)other text(example2CamelCaseText)";
const outputText = convertCamelCaseInBracketsToSnakeCase(inputText);

console.log(outputText);
