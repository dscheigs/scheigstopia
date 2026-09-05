import StyleDictionary from 'style-dictionary';

/**
 * Sylva token build.
 *
 * Inputs  : tokens/*.tokens.json  (W3C DTCG)
 * Outputs : dist/sylva.css   - CSS custom properties, themed
 *                              (:root = light; prefers-color-scheme + [data-theme] for dark)
 *           dist/sylva.js    - nested object of resolved values, `export default`
 *           dist/sylva.d.ts  - types for the above
 *           dist/sylva.tokens.json - the same nested object as JSON
 */

const isSemantic = (token) => (token.filePath ?? '').includes('semantic');
const themeOf = (token) => token.path[1]; // 'light' | 'dark' for semantic tokens
const val = (token) => token.$value ?? token.value;

// `--color-bg-canvas` for semantic (drop the light/dark segment),
// `--color-green-800` for primitives.
const cssVar = (token) => {
    const path = isSemantic(token)
        ? [token.path[0], ...token.path.slice(2)]
        : token.path;
    return `--${path.join('-')}`;
};

const declarations = (tokens, indent) =>
    tokens.map((t) => `${indent}${cssVar(t)}: ${val(t)};`).join('\n');

/** Build a nested plain object of resolved values from the flat token list. */
const nest = (tokens) => {
    const root = {};
    for (const t of tokens) {
        let node = root;
        t.path.slice(0, -1).forEach((seg) => (node = node[seg] ??= {}));
        node[t.path.at(-1)] = val(t);
    }
    return root;
};

/** Emit a `.d.ts` that types every leaf as `string`. */
const typeOf = (obj, indent = '  ') =>
    `{\n${Object.entries(obj)
        .map(([k, v]) => {
            const key = /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
            return `${indent}${key}: ${
                typeof v === 'object' ? typeOf(v, indent + '  ') : 'string'
            };`;
        })
        .join('\n')}\n${indent.slice(2)}}`;

StyleDictionary.registerFormat({
    name: 'sylva/css',
    format: ({ dictionary }) => {
        const all = dictionary.allTokens;
        const primitives = all.filter((t) => !isSemantic(t));
        const light = all.filter(
            (t) => isSemantic(t) && themeOf(t) === 'light'
        );
        const dark = all.filter((t) => isSemantic(t) && themeOf(t) === 'dark');

        return `/**
 * Sylva color system — generated, do not edit.
 */

:root {
  /* primitives */
${declarations(primitives, '  ')}

  /* semantic — light (default) */
${declarations(light, '  ')}
}

@media (prefers-color-scheme: dark) {
  :root {
${declarations(dark, '    ')}
  }
}

[data-theme='dark'] {
${declarations(dark, '  ')}
}

[data-theme='light'] {
${declarations(light, '  ')}
}
`;
    },
});

StyleDictionary.registerFormat({
    name: 'sylva/js',
    format: ({ dictionary }) =>
        `/** Sylva color system — generated, do not edit. */\nexport default ${JSON.stringify(
            nest(dictionary.allTokens),
            null,
            2
        )};\n`,
});

StyleDictionary.registerFormat({
    name: 'sylva/dts',
    format: ({ dictionary }) =>
        `/** Sylva color system — generated, do not edit. */\ndeclare const tokens: ${typeOf(
            nest(dictionary.allTokens)
        )};\nexport default tokens;\n`,
});

StyleDictionary.registerFormat({
    name: 'sylva/json',
    format: ({ dictionary }) =>
        JSON.stringify(nest(dictionary.allTokens), null, 2) + '\n',
});

const sd = new StyleDictionary({
    source: ['tokens/*.tokens.json'],
    usesDtcg: true,
    log: { verbosity: 'verbose' },
    platforms: {
        css: {
            transformGroup: 'css',
            buildPath: 'dist/',
            files: [{ destination: 'sylva.css', format: 'sylva/css' }],
        },
        js: {
            transformGroup: 'js',
            buildPath: 'dist/',
            files: [
                { destination: 'sylva.js', format: 'sylva/js' },
                { destination: 'sylva.d.ts', format: 'sylva/dts' },
                { destination: 'sylva.tokens.json', format: 'sylva/json' },
            ],
        },
    },
});

await sd.hasInitialized;
await sd.buildAllPlatforms();
