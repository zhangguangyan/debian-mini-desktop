function removeEmpty2(obj, isTopLevel = true) {
    if (Array.isArray(obj)) {
        // Filter out empty elements and recursively clean each element
        const filteredArray = obj
            .map(el => removeEmpty(el, false))
            .filter(el => el !== null && el !== undefined && (typeof el !== 'object' || Object.keys(el).length > 0));

        // Return empty array if it's the top-level array, otherwise null if the array is empty
        return filteredArray.length || isTopLevel ? filteredArray : null;
    } else if (typeof obj === 'object' && obj !== null) {
        // Clean each property recursively
        const cleanedObj = Object.keys(obj).reduce((acc, key) => {
            const cleanedValue = removeEmpty(obj[key], false);
            if (cleanedValue !== null && cleanedValue !== undefined && (typeof cleanedValue !== 'object' || Object.keys(cleanedValue).length > 0)) {
                acc[key] = cleanedValue;
            }
            return acc;
        }, {});

        return Object.keys(cleanedObj).length ? cleanedObj : null;
    }
    // Return non-object value as is
    return obj;
}

var safe = Regex.Replace(
    rawJson,
    @"(?<!\\)[\u0000-\u001F]",
    m => m.Value switch {
        "\n" => @"\n", "\r" => @"\r", "\t" => @"\t",
        _    => $@"\u{(int)m.Value[0]:x4}"
    });



using System;
using System.Text;

public static class JsonSanitizer
{
    // Escapes raw control codes; returns the original string if none found.
    public static string EscapeControlChars(string input)
    {
        ReadOnlySpan<char> src = input;
        int idx = src.IndexOfAnyInRange('\u0000', '\u001F');    // .NET 8 API
        if (idx == -1) return input;                            // fast-path

        var sb = new StringBuilder(src.Length + 8);
        sb.Append(src[..idx]);                                  // copy safe prefix
        for (int i = idx; i < src.Length; i++)
        {
            char c = src[i];
            if (c <= 0x1F)                                      // illegal
            {
                sb.Append(c switch
                {
                    '\n' => "\\n",
                    '\r' => "\\r",
                    '\t' => "\\t",
                    _     => $"\\u{(int)c:x4}"
                });
            }
            else sb.Append(c);
        }
        return sb.ToString();
    }
}


using System;
using System.Text;

public static class JsonFixer
{
    /// <summary>
    /// Scans the JSON text and escapes control characters that appear
    /// *inside* string values.  If the input is already valid JSON, the
    /// original reference is returned (zero allocations).
    /// </summary>
    public static string EscapeStringValues(string json)
    {
        // Fast exit: no control chars at all → already valid
        ReadOnlySpan<char> span = json;
        if (span.IndexOfAnyInRange('\u0000', '\u001F') == -1)
            return json;

        var sb       = new StringBuilder(json.Length + 8);
        bool inStr   = false;   // are we inside a " ... " literal?
        bool escaped = false;   // was the previous char a backslash?

        foreach (char c in span)
        {
            if (!inStr)
            {
                // entering a string?
                if (c == '\"') inStr = true;
                sb.Append(c);
                continue;
            }

            // We are *inside* a string literal …
            if (escaped)                // part of an escape sequence → copy verbatim
            {
                sb.Append(c);
                escaped = false;
            }
            else if (c == '\\')         // start of an escape sequence
            {
                sb.Append(c);
                escaped = true;
            }
            else if (c == '\"')         // end of the string literal
            {
                sb.Append(c);
                inStr = false;
            }
            else if (c <= 0x1F)         // raw control code → ESCAPE!
            {
                sb.Append(c switch
                {
                    '\n' => "\\n",
                    '\r' => "\\r",
                    '\t' => "\\t",
                    _    => $"\\u{(int)c:x4}"
                });
            }
            else                         // normal payload char
            {
                sb.Append(c);
            }
        }
        return sb.ToString();
    }
}



