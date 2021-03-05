import math
import os
import subprocess
from multiprocessing import Pool

TEMPLATE_NAMES = ["blank", "react", "vue", "svelte", "preact", "lit-element"]
TEMPLATE_NAMES += [f"{t}-typescript" for t in TEMPLATE_NAMES]

def create_app(template_name):
    folder = f"created-snowpack-apps/{template_name}"
    if os.path.exists(folder):
        print(
            f"Snowpack app template {template_name} already exists.",
            flush=True
        )
    else:
        cmd = " ".join([
            f"npx create-snowpack-app {folder}",
            f"--template @snowpack/app-template-{template_name}",
            "--no-install",
        ])
        # print(cmd, flush=True)
        subprocess.run(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.STDOUT,
            shell=True,
        )
        print(f"Created Snowpack app template {template_name}.", flush=True)

def main():
    threads = os.cpu_count()
    if threads is None or threads < 6:
        raise SystemExit(1)

    # 3 processes maxes out a 4C/8T Ryzen 1500X
    # 6T -> 2p
    # 8T -> 3p
    # 12T -> 4p
    # ...
    # 32T -> 12p
    processes = min(12, math.floor(3/8 * threads))
    with Pool(processes=processes) as pool:
        pool.map(create_app, TEMPLATE_NAMES)

if __name__ == "__main__":
    main()
