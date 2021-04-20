# snowpack-start

> [What is Snowpack?](https://www.snowpack.dev/)
>
> Snowpack is a lightning-fast frontend build tool, designed for the modern web. It is an alternative to heavier, more complex bundlers like webpack or Parcel in your development workflow.

The problem: manually customizing templates from [`create-snowpack-app`](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/cli) was annoying.

The solution: `snowpack-start` (`snowpack-init` was already taken). `snowpack-start` installs your packages and generates boilerplate so you can get to developing faster.

## Upcoming in 1.0.0-beta.5

### 🚨 Breaking Changes
None

### ⚠️ Non-breaking Changes
`f99bb0c` — Removed `treeshake` from Snowpack bundler default settings<br>
`d4777d6` — Removed cssnano when using Snowpack bundler
`_` — Added limited PostCSS processing in development env

### 🔧 Fixes
None

<br>

## Usage
Node version ≥ 10 is required.

```
$ npx snowpack-start [project-directory] [other-options]
```

All CLI options (including project directory) are optional.

With no CLI options:

<div>
    <img src="https://github.com/awu43/snowpack-start/raw/master/media/no-cli-args.gif" alt="No CLI options">
</div>

<br>

With some CLI options:

<div>
    <img src="https://github.com/awu43/snowpack-start/raw/master/media/some-cli-args.gif" alt="Some CLI options">
</div>


Using all CLI options and skipping prompts entirely is also possible.

<br>

### CLI Options
| Syntax                                    | Description                  |
|-------------------------------------------|------------------------------|
| `-d, --defaults`                          | Use default options          |
| `--load <files...>`                       | Load options from files      |
| `-jsf, --js-framework <framework>`        | JavaScript framework         |
| `-cdf, --code-formatters <formatters...>` | Code formatters              |
| `-ts, --typescript`                       | Use TypeScript               |
| `-nts, --no-typescript`                   | Don't use TypeScript         |
| `-s, --sass`                              | Use Sass                     |
| `-ns, --no-sass`                          | Don't use Sass               |
| `-cssf, --css-framework <framework>`      | CSS framework                |
| `-b, --bundler <bundler>`                 | Bundler                      |
| `-p, --plugins <plugins...>`              | Other plugins                |
| `-l, --license <license>`                 | License                      |
| `-a, --author <author>`                   | Author                       |
| `--use-yarn`                              | Use Yarn (no prompt)         |
| `--use-pnpm`                              | Use pnpm (no prompt)         |
| `--skip-tailwind-init`                    | Skip TailwindCSS init (no prompt) |
| `--skip-eslint-init`                      | Skip ESLint init (no prompt) |
| `--skip-git-init`                         | Skip git init (no prompt)    |

<br/>

| Option               | Valid Values                                         |
|----------------------|------------------------------------------------------|
| JavaScript framework | `none`/`react`/`vue`/`svelte`/`preact`/`lit-element` |
| Code formatters      | `none`, `eslint`, `prettier`                         |
| CSS framework        | `none`/`tailwindcss`/`bootstrap`                     |
| Bundler              | `webpack`/`snowpack`/`none`                          |
| Other plugins        | `none`, `wtr`, `postcss`, `srs`, `sbs`               |
| License              | `mit`/`gpl`/`apache`/`none`                          |

<br>

| Value     | Plugin                             |
|-----------|------------------------------------|
| `wtr`     | `@snowpack/web-test-runner-plugin` |
| `postcss` | `@snowpack/plugin-postcss`         |
| `srs`     | `@snowpack/plugin-run-script`      |
| `sbs`     | `@snowpack/plugin-build-script`    |

<br>

### Default Options
On startup, `snowpack-start` will look for a `.snowpackstart.js` file in the home directory. If it exists, then those options are loaded and applied as the initial selections/values of the prompts. Otherwise, the [built-in default options](https://github.com/awu43/snowpack-start/blob/master/src/defaults.js) are used.

<div>
    <img src="https://github.com/awu43/snowpack-start/raw/master/media/default-app.png" alt="Using default options">
</div>

<br>

### Loading Options From Files
Specify paths to files, and options will be loaded from them:

<div>
    <img src="https://github.com/awu43/snowpack-start/raw/master/media/loading-files.png" alt="Loading options from files">
</div>

<br>

### Order Of Operations
```
Defaults >> Files >> CLI >> Prompts
```

Later options overwrite earlier ones:

<div>
    <img src="https://github.com/awu43/snowpack-start/raw/master/media/overwriting-options.png" alt="Overwriting previous options">
</div>

<br>

## Issues
### Known
* `@snowpack/web-test-runner-plugin` has not been verified to work with Vue or LitElement.
* ESLint init only supports React and Vue, additional setup required for using ESLint with Svelte, Preact, and LitElement.

### The mystery `.types` folder
When using `create-snowpack-app` with `app-template-react`, a `.types` folder of unknown purpose is generated in the app directory. Deleting it has no effect on the dev server, testing, or the final build and nobody answered [when I asked](https://github.com/snowpackjs/snowpack/discussions/2657) what it was for so it has been removed from distribution. If you're having issues with React, try adding it back in.

### Reporting
Please report any other issues [here](https://github.com/awu43/snowpack-start/issues).

<br>

## Acknowledgements
Portions of code have been adapted from [create-snowpack-app](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/cli) and [create-react-app](https://github.com/facebook/create-react-app/tree/master/packages/create-react-app).

Official app templates from `create-snowpack-app`, with configurations from community templates used.

## License
MIT
