# snowpack-start

> [What is Snowpack?](https://www.snowpack.dev/)
>
> Snowpack is a lightning-fast frontend build tool, designed for the modern web. It is an alternative to heavier, more complex bundlers like webpack or Parcel in your development workflow.

The problem: manually customizing templates from [`create-snowpack-app`](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/cli) was annoying.

The solution: `snowpack-start` (`snowpack-init` was already taken). `snowpack-start` installs packages and generates configuration boilerplate so you can get to developing faster.

## New in v2.0.0

### 🚨 Breaking Changes
`c1391e3` — New other deps options<br>
`a3ce4e0` — JS framework option renamed to base template

### ⚠️ Non-breaking Changes
`b67f64f` — Loading files no longer requires file extensions<br>
`56ae0c4` — New React-Redux templates<br>
`e50d511` — Changed base `.prettierrc` to be empty

### 🔧 Fixes
`69d7d50` — Workaround for import bug is now automatically added if required

### 🏔️ Snowpack Template Changes
`2b52a7f` — Updated `App.svelte` in `svelte-typescript` template

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

#### Active

Prompts will be displayed for active options not otherwise provided on the command line.

| Syntax                                    | Description                  |
|-------------------------------------------|------------------------------|
| `-d, --defaults`                          | Use default options          |
| `--load <files...>`                       | Load options from files      |
| `-bt, --base-template <template>`         | Base template                |
| `-cdf, --code-formatters <formatters...>` | Code formatters              |
| `-ts, --typescript`                       | Use TypeScript               |
| `-nts, --no-typescript`                   | Don't use TypeScript         |
| `-s, --sass`                              | Use Sass                     |
| `-ns, --no-sass`                          | Don't use Sass               |
| `-cssf, --css-framework <framework>`      | CSS framework                |
| `-b, --bundler <bundler>`                 | Bundler                      |
| `-p, --plugins <plugins...>`              | Other plugins                |
| `-opd, --other-prod-deps <deps...>`       | Other prod dependencies      |
| `-odd, --other-dev-deps <deps...>`        | Other dev dependencies       |
| `-l, --license <license>`                 | License                      |
| `-a, --author <author>`                   | Author (for MIT license)     |

<br/>

| Option               | Valid Values                                         |
|----------------------|------------------------------------------------------|
| JavaScript framework | `blank`/`react`/`react-redux`/`vue`/`svelte`/`preact`/`lit-element` |
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

⚠️ Don't install `@snowpack/plugin-run-script` or `@snowpack/plugin-build-script` unless you have a reason to! They're not required to run Snowpack and are for additional processing that isn't already handled by existing plugins.

<br>

#### Passive

Passive options do not have prompts.

| Syntax                                    | Description                  |
|-------------------------------------------|------------------------------|
| `--use-yarn`                              | Use Yarn                     |
| `--no-use-yarn`                           | Don't use Yarn               |
| `--use-pnpm`                              | Use pnpm                     |
| `--no-use-pnpm`                           | Don't use pnpm               |
| `--skip-tailwind-init`                    | Skip TailwindCSS init        |
| `--no-skip-tailwind-init`                 | Don't skip TailwindCSS init  |
| `--skip-eslint-init`                      | Skip ESLint init             |
| `--no-skip-eslint-init`                   | Don't skip ESLint init       |
| `--skip-git-init`                         | Skip git init                |
| `--no-skip-git-init`                      | Don't skip git init          |

<br>

### Default Options
On startup, `snowpack-start` will look for a `.snowpackstart.js` file in the home directory. If it exists, then the options in that file are loaded as default options. Otherwise, the [built-in default options](https://github.com/awu43/snowpack-start/blob/master/src/defaults.js) are used.

Passive defaults will always be used regardless of whether the defaults flag has been passed on the command line. Active defaults will only be used if `-d` or `--defaults` has been passed.

<div>
    <img src="https://github.com/awu43/snowpack-start/raw/master/media/default-app.png" alt="Using default options">
</div>

After CLI processing, the loaded defaults are applied as the initial selections/values of their corresponding prompts.

<br>

### Loading Options From Files
Specify paths to files (extension optional), and options will be loaded from them:

<div>
    <img src="https://github.com/awu43/snowpack-start/raw/master/media/loading-files.png" alt="Loading options from files">
</div>

<br>

### Order Of Operations
```
Defaults >> Files >> CLI >> Prompts
```

Later options overwrite earlier ones, with the exception of other deps:

<div>
    <img src="https://github.com/awu43/snowpack-start/raw/master/media/overwriting-options.png" alt="Overwriting previous options">
</div>

The other deps options are instead additive, so later deps will be added to the existing deps. To clear previous deps, use `none` in files or CLI:

<br>

## Issues
### Known
* Starting with Snowpack v3.1 and as of v3.8.3 (checked July 30, 2021), image/JSON imports break builds using the built-in bundler ([#3109](https://github.com/snowpackjs/snowpack/issues/3109)). A [workaround](https://github.com/snowpackjs/snowpack/issues/3109#issuecomment-821514740) is automatically added if `snowpack` is selected as the bundler.
* `eslint --init` only supports React and Vue, additional setup required for Svelte, Preact, and LitElement.
* `eslint --init` only installs packages with npm, no option to use Yarn or pnpm.

### Reporting
Please report any other issues [here](https://github.com/awu43/snowpack-start/issues).

<br>

## Acknowledgements
Portions of code have been adapted from [create-snowpack-app](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/cli) and [create-react-app](https://github.com/facebook/create-react-app/tree/master/packages/create-react-app).

Official app templates from `create-snowpack-app`, with configurations from community templates used.

React-Redux templates adapted from `create-react-app`.

## License
MIT
