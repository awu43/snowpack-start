import math
import os
import subprocess
from multiprocessing import Pool

SOURCE_CONFIGS = {
    "blank": [
        "--js-framework none",
        "--code-formatters prettier",
        "--no-typescript",
        "--plugins none",
    ],
    "blank-typescript": [
        "--js-framework none",
        "--code-formatters prettier",
        "--typescript",
        "--plugins none",
    ],
    "react": [
        "--js-framework react",
        "--code-formatters prettier",
        "--no-typescript",
        "--plugins wtr",
    ],
    "react-typescript": [
        "--js-framework react",
        "--code-formatters prettier",
        "--typescript",
        "--plugins wtr",
    ],
    "vue": [
        "--js-framework vue",
        "--code-formatters none",
        "--no-typescript",
        "--plugins none",
    ],
    "vue-typescript": [
        "--js-framework vue",
        "--code-formatters none",
        "--typescript",
        "--plugins none",
    ],
    "svelte": [
        "--js-framework svelte",
        "--code-formatters none",
        "--no-typescript",
        "--plugins wtr",
    ],
    "svelte-typescript": [
        "--js-framework svelte",
        "--code-formatters none",
        "--typescript",
        "--plugins wtr",
    ],
    "preact": [
        "--js-framework preact",
        "--code-formatters prettier",
        "--no-typescript",
        "--plugins wtr",
    ],
    "preact-typescript": [
        "--js-framework preact",
        "--code-formatters prettier",
        "--typescript",
        "--plugins wtr",
    ],
    "lit-element": [
        "--js-framework lit-element",
        "--code-formatters prettier",
        "--no-typescript",
        "--plugins none",
    ],
    "lit-element-typescript": [
        "--js-framework lit-element",
        "--code-formatters prettier",
        "--typescript",
        "--plugins none",
    ],
}

def create_starter(config_item):
    name, config = config_item
    cmd = " ".join([
        "node src/index.js",
        f"snowpack-starters/{name}",
        *config,
        "--no-sass",
        "--css-framework none",
        "--bundler none",
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
    print(f"Created Snowpack starter template {name}.", flush=True)

def main():
    threads = os.cpu_count()
    if threads is not None and threads >= 6:
        processes = min(12, math.floor(3/8 * threads))
        with Pool(processes=processes) as pool:
            pool.map(create_starter, SOURCE_CONFIGS.items())
    else:
        for temp in SOURCE_CONFIGS.items():
            create_starter(temp)

if __name__ == "__main__":
    main()
