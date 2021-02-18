import math
import os
import subprocess
from multiprocessing import Pool

TEMPLATE_NAMES = ["blank", "react", "vue", "svelte", "preact", "lit-element"]
TEMPLATE_NAMES += [f"{t}-typescript" for t in TEMPLATE_NAMES]

def create_app(template_name):
    cmd = " ".join([
        f"npx create-snowpack-app created-snowpack-apps/{template_name}",
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
    print(f"Created app template {template_name}.", flush=True)

def main():
    threads = os.cpu_count()
    if threads is not None and threads >= 6:
        # 3 processes maxes out a 4C/8T Ryzen 1500X
        # 6T -> 2p
        # 8T -> 3p
        # 12T -> 4p
        # ...
        # 32T -> 12p
        processes = min(12, math.floor(3/8 * threads))
        with Pool(processes=processes) as pool:
            pool.map(create_app, TEMPLATE_NAMES)
    else:
        for temp in TEMPLATE_NAMES:
            create_app(temp)

if __name__ == "__main__":
    main()
