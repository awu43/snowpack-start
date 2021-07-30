import math
import os
import subprocess
from multiprocessing import Pool

SOURCE_CONFIGS = {
    "blank": [
        "--base-template blank",
        "--code-formatters prettier",
        "--no-typescript",
        "--plugins none",
    ],
    "blank-typescript": [
        "--base-template blank",
        "--code-formatters prettier",
        "--typescript",
        "--plugins none",
    ],
    "react": [
        "--base-template react",
        "--code-formatters prettier",
        "--no-typescript",
        "--plugins wtr",
    ],
    "react-typescript": [
        "--base-template react",
        "--code-formatters prettier",
        "--typescript",
        "--plugins wtr",
    ],
    "vue": [
        "--base-template vue",
        "--code-formatters none",
        "--no-typescript",
        "--plugins none",
    ],
    "vue-typescript": [
        "--base-template vue",
        "--code-formatters none",
        "--typescript",
        "--plugins none",
    ],
    "svelte": [
        "--base-template svelte",
        "--code-formatters none",
        "--no-typescript",
        "--plugins wtr",
    ],
    "svelte-typescript": [
        "--base-template svelte",
        "--code-formatters none",
        "--typescript",
        "--plugins wtr",
    ],
    "preact": [
        "--base-template preact",
        "--code-formatters prettier",
        "--no-typescript",
        "--plugins wtr",
    ],
    "preact-typescript": [
        "--base-template preact",
        "--code-formatters prettier",
        "--typescript",
        "--plugins wtr",
    ],
    "lit-element": [
        "--base-template lit-element",
        "--code-formatters prettier",
        "--no-typescript",
        "--plugins none",
    ],
    "lit-element-typescript": [
        "--base-template lit-element",
        "--code-formatters prettier",
        "--typescript",
        "--plugins none",
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
