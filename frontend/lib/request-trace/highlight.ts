// Tiny syntax highlighter that emits VS Code "Dark+"/"Light+" token classes.
//
// We intentionally do NOT pull in a full highlighter (shiki/prism). The code
// snippets in checkpoints are short and limited to Python, TypeScript, and
// Nginx config, so a hand-written tokenizer keeps the bundle small and the
// output styled exactly like the editor screenshots the team works from.

export type TokenType =
  | "text"
  | "comment"
  | "string"
  | "number"
  | "keyword" // control flow, imports
  | "storage" // declarations: def / class / const / function
  | "builtin" // True / None / string / int / Path / …
  | "function" // call sites and defining names
  | "decorator" // @foo
  | "variable"; // $var in nginx

export interface Token {
  readonly text: string;
  readonly type: TokenType;
}

interface Rule {
  readonly type: TokenType;
  readonly regex: RegExp; // MUST use the sticky (/y) flag
}

/* ── Python ──────────────────────────────────────────────────────── */

const PY_RULES: readonly Rule[] = [
  { type: "comment", regex: /#[^\n]*/y },
  // Triple-quoted strings (with optional byte/raw/unicode/format prefix).
  { type: "string", regex: /[bBrRuUfF]{0,2}(?:"""[\s\S]*?"""|'''[\s\S]*?''')/y },
  // Single-line strings.
  { type: "string", regex: /[bBrRuUfF]{0,2}(?:"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/y },
  { type: "decorator", regex: /@[A-Za-z_][\w.]*/y },
  {
    type: "keyword",
    regex:
      /\b(?:if|elif|else|for|while|break|continue|return|yield|pass|raise|try|except|finally|with|as|from|import|and|or|not|in|is|lambda|global|nonlocal|assert|del|match|case)\b/y,
  },
  { type: "storage", regex: /\b(?:def|class|async|await)\b/y },
  // Function/callable names win over builtins so `isinstance(` / `Path(` render yellow.
  { type: "function", regex: /\b[A-Za-z_]\w*(?=\s*\()/y },
  {
    type: "builtin",
    regex:
      /\b(?:True|False|None|self|cls|int|str|float|bool|list|dict|tuple|set|bytes|bytearray|frozenset|Path|print|len|range|enumerate|zip|map|filter|isinstance|type|open|sorted|reversed|sum|min|max|abs|round|any|all)\b/y,
  },
  { type: "number", regex: /\b\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?\b/y },
  { type: "text", regex: /[A-Za-z_]\w*/y },
  { type: "text", regex: /\s+/y },
];

/* ── TypeScript ──────────────────────────────────────────────────── */

const TS_RULES: readonly Rule[] = [
  { type: "comment", regex: /\/\/[^\n]*/y },
  { type: "comment", regex: /\/\*[\s\S]*?\*\//y },
  // Backtick template (we don't recurse into ${} — full tokens render fine).
  { type: "string", regex: /`(?:\\.|[^`\\])*`/y },
  { type: "string", regex: /"(?:\\.|[^"\\\n])*"/y },
  { type: "string", regex: /'(?:\\.|[^'\\\n])*'/y },
  {
    type: "keyword",
    regex:
      /\b(?:if|else|for|while|do|return|break|continue|throw|try|catch|finally|switch|case|default|import|export|from|as|new|in|of|typeof|instanceof|delete|yield|async|await)\b/y,
  },
  {
    type: "storage",
    regex:
      /\b(?:const|let|var|function|class|interface|type|enum|extends|implements|public|private|protected|readonly|static|abstract|declare|namespace|module|get|set)\b/y,
  },
  { type: "function", regex: /\b[A-Za-z_$][\w$]*(?=\s*\()/y },
  {
    type: "builtin",
    regex:
      /\b(?:true|false|null|undefined|this|super|void|any|string|number|boolean|never|unknown|object|Promise|Array|Map|Set|Record|Partial|Pick|Omit|Readonly)\b/y,
  },
  { type: "number", regex: /\b\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?n?\b/y },
  { type: "text", regex: /[A-Za-z_$][\w$]*/y },
  { type: "text", regex: /\s+/y },
];

/* ── Nginx ───────────────────────────────────────────────────────── */

const NGX_RULES: readonly Rule[] = [
  { type: "comment", regex: /#[^\n]*/y },
  { type: "string", regex: /"(?:\\.|[^"\\\n])*"/y },
  { type: "string", regex: /'(?:\\.|[^'\\\n])*'/y },
  { type: "variable", regex: /\$[A-Za-z_]\w*/y },
  {
    type: "keyword",
    regex:
      /\b(?:server|location|proxy_pass|proxy_set_header|proxy_redirect|proxy_read_timeout|proxy_connect_timeout|proxy_http_version|listen|server_name|root|index|return|rewrite|if|include|types|http|upstream|worker_processes|events|access_log|error_log|client_max_body_size|gzip|ssl_certificate|ssl_certificate_key|add_header|try_files|fastcgi_pass|alias|break|set|default_type|sendfile|keepalive_timeout|worker_connections|use|multi_accept|map)\b/y,
  },
  { type: "number", regex: /\b\d+[kKmMgG]?\b/y },
  { type: "text", regex: /[A-Za-z_][\w-]*/y },
  { type: "text", regex: /\s+/y },
];

const RULE_SETS: Record<string, readonly Rule[]> = {
  python: PY_RULES,
  typescript: TS_RULES,
  nginx: NGX_RULES,
};

/* ── Tokenizer ───────────────────────────────────────────────────── */

export function highlight(code: string, language: string): readonly Token[] {
  const rules = RULE_SETS[language];
  if (rules === undefined) {
    // Unknown or "none" — return one passthrough token.
    return [{ text: code, type: "text" }];
  }

  const tokens: Token[] = [];
  let pos = 0;

  while (pos < code.length) {
    let matched = false;

    for (const rule of rules) {
      rule.regex.lastIndex = pos;
      const m = rule.regex.exec(code);
      if (m !== null && m.index === pos && m[0].length > 0) {
        appendToken(tokens, { text: m[0], type: rule.type });
        pos += m[0].length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Fallback: consume one character as plain text (punctuation, operators, …).
      const ch = code[pos] ?? "";
      appendToken(tokens, { text: ch, type: "text" });
      pos += 1;
    }
  }

  return tokens;
}

function appendToken(tokens: Token[], next: Token): void {
  // Coalesce adjacent "text" tokens so React renders fewer spans.
  const last = tokens[tokens.length - 1];
  if (last !== undefined && last.type === "text" && next.type === "text") {
    tokens[tokens.length - 1] = { text: last.text + next.text, type: "text" };
    return;
  }
  tokens.push(next);
}
