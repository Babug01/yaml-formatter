# YAML Linter, Formatter & Validator

A YAML formatter and linter with a real code editor and error locations you can actually act on —
"line 63, column 8", not a vague parse failure. Runs entirely in the browser; nothing you paste
ever leaves your machine.

## Features

- **Format** with configurable indentation
- **Validate / Lint** in strict mode — catches duplicate keys, bad indentation, and other issues a
  lenient parser would silently accept
- **Tree View** — a collapsible explorer for the parsed structure, available as a direct action
- **Precise error locations** using the `yaml` package's structured line/column positions
- Upload a `.yaml`/`.yml` file or paste directly; download the formatted result
- Dark / light theme, synced to your system preference

## Why I built this

Most online YAML validators give you a bare textarea and a one-line "invalid YAML" message with no
indication of where. I wanted exact line/column locations and a real editor. This is also one piece
of a larger internal DevOps tool I built at work consolidating the utility pages a platform engineer
reaches for daily into one place — this repo is the YAML formatter piece, cleaned up and
open-sourced on its own.

## Tech Stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [CodeMirror 6](https://codemirror.net/) (via `@uiw/react-codemirror`) for the editor panes
- [`yaml`](https://eemeli.org/yaml/) for parsing/serializing, in strict mode

## Running locally

```bash
git clone https://github.com/Babug01/yaml-formatter.git
cd yaml-formatter
npm install
npm run dev
```

## License

MIT — see [LICENSE](LICENSE).
