import math
import os
import subprocess
from multiprocessing import Pool

SOURCE_CONFIGS = {
    "blank": [
        "--base-template blank",
        "--testing none",
        "--code-formatters prettier",
        "--no-typescript",
    ],
    "blank-typescript": [
        "--base-template blank",
        "--testing none",
        "--code-formatters prettier",
        "--typescript",
    ],
    "react": [
        "--base-template react",
        "--testing wtr",
        "--code-formatters prettier",
        "--no-typescript",
    ],
    "react-typescript": [
        "--base-template react",
        "--testing wtr",
        "--code-formatters prettier",
        "--typescript",
    ],
    "vue": [
        "--base-template vue",
        "--testing none",
        "--code-formatters none",
        "--no-typescript",
    ],
    "vue-typescript": [
        "--base-template vue",
        "--testing none",
        "--code-formatters none",
        "--typescript",
    ],
    "svelte": [
        "--base-template svelte",
        "--testing wtr",
        "--code-formatters none",
        "--no-typescript",
    ],
    "svelte-typescript": [
        "--base-template svelte",
        "--testing wtr",
        "--code-formatters none",
        "--typescript",
    ],
    "preact": [
        "--base-template preact",
        "--testing wtr",
        "--code-formatters prettier",
        "--no-typescript",
    ],
    "preact-typescript": [
        "--base-template preact",
        "--testing wtr",
        "--code-formatters prettier",
        "--typescript",
    ],
    "lit-element": [
        "--base-template lit-element",
        "--testing none",
        "--code-formatters prettier",
        "--no-typescript",
    ],
    "lit-element-typescript": [
        "--base-template lit-element",
        "--testing none",
        "--code-formatters prettier",
        "--typescript",
    ],
}

def create_starter(config_item):
    template, config = config_item
    folder = f"snowpack-starters/{template}"
    if os.path.exists(folder):
        print(
            f"Snowpack starter template {template} already exists.",
            flush=True
        )
    else:
        cmd = " ".join([
            "node dist/index.js",
            folder,
            *config,
            "--no-sass",
            "--css-framework none",
            "--bundler none",
            "--plugins none",
            "--other-prod-deps none",
            "--other-dev-deps none",
            "--license none",
            "--skip-git-init",
        ])
        # print(cmd, flush=True)
        subprocess.run(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.STDOUT,
            shell=True,
        )
        print(f"Created Snowpack starter template {template}.", flush=True)

def main():
    threads = os.cpu_count()
    if threads is None or threads < 6:
        raise SystemExit(1)

    processes = min(12, math.floor(3/8 * threads))
    with Pool(processes=processes) as pool:
        pool.map(create_starter, SOURCE_CONFIGS.items())

if __name__ == "__main__":
    main()
