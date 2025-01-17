console.log("Hello, world!");
interface PathValue {
    path: string;
    value: unknown;
  }
  
  /**
   * Returns all leaf values matching a path that may include "*".
   * For array segments, we use the actual numeric index in the final path.
   * 
   * Examples:
   *   - "a/b/c" => finds data.a.b.c
   */
  function getValuesByWildcardPath(
    data: unknown,
    wildcardPath: string
  ): PathValue[] {
    // Split the path into segments, e.g. "a/b2/*/d/*/f" => ["a","b2","*","d","*","f"]
    const segments = wildcardPath.split("/");
    const results: PathValue[] = [];
  
    /**
     * Recursively traverse 'currentData' with the remaining path segments,
     * building the 'currentPath' as we go.
     */
    function recurse(
      currentData: unknown,
      currentPath: string,
      segIndex: number
    ) {
      // If we've consumed all segments, then 'currentData' is a leaf match.
      if (segIndex >= segments.length) {
        results.push({
          path: currentPath || "(root)",
          value: currentData,
        });
        return;
      }
  
      const segment = segments[segIndex];
  
      // Case 1: wildcard segment "*"
      if (segment === "*") {
        // Must be an array to iterate
        if (!Array.isArray(currentData)) {
          // If it's not an array, no match here
          return;
        }
        // For each element in the array, recurse deeper
        currentData.forEach((elem, idx) => {
          const newPath = currentPath
            ? `${currentPath}/${idx}`
            : String(idx);
          recurse(elem, newPath, segIndex + 1);
        });
      }
      // Case 2: normal segment (object property)
      else {
        // currentData should be an object (and not an array)
        if (
          currentData === null ||
          typeof currentData !== "object" ||
          Array.isArray(currentData)
        ) {
          // No match
          return;
        }
        const obj = currentData as Record<string, unknown>;
        const nextData = obj[segment];
        if (nextData === undefined) {
          // Key doesn't exist => no match
          return;
        }
        const newPath = currentPath
          ? `${currentPath}/${segment}`
          : segment;
        recurse(nextData, newPath, segIndex + 1);
      }
    }
  
    // Start recursion from the root data with an empty currentPath
    recurse(data, "", 0);
  
    return results;
  }
  
  // ---------------------------------------------------
  // Example usage
  // ---------------------------------------------------
  const data = {
    a: {
      b: {
        c: 1,
      },
      b2: [
        {
          d: 2,
          e: [
            { f: 3 },
            { f: 3 },
          ],
        },
        {
          d: 4,
          e: [
            { f: 5 },
          ],
        },
      ],
    },
  };
  
  console.log("Path: a/b/c");
  const matches1 = getValuesByWildcardPath(data, "a/b/c");
  console.log(matches1);
  /* 
  Output:
  [
    { path: 'a/b/c', value: 1 }
  ]
  */
  
  console.log("Path: a/b2/*/e/*/f");
  const matches2 = getValuesByWildcardPath(data, "a/b2/*/e/*/f");
  console.log(matches2);
  /*
  Output:
  [
    { path: 'a/b2/0/e/0/f', value: 3 },
    { path: 'a/b2/0/e/1/f', value: 3 },
    { path: 'a/b2/1/e/0/f', value: 5 }
  ]
  */
  
