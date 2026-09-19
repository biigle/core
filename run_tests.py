#!/usr/bin/env python3

import re
import subprocess
import sys
from pathlib import Path

PASSED_FILE = Path("passed_tests.txt")

COMMAND = [
    "docker", "compose", "run", "--rm", "worker",
    "php", "artisan", "test",
    "--stop-on-defect",
]

expression = re.compile(r'(Biigle\\\S+Test)')

def main():
    if "--reset" in sys.argv or "-r" in sys.argv:
        PASSED_FILE.write_text("")

    passed = set()

    if PASSED_FILE.exists():
        passed = {
            line.strip()
            for line in PASSED_FILE.read_text().splitlines()
            if line.strip()
        }

    command = COMMAND.copy()

    if passed:
        exclude_filter = "|".join(re.escape(test) for test in passed)
        command += ["--exclude-filter", exclude_filter]

    print("$", " ".join(command))
    print()

    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    for line in process.stdout:
        print(line, end="")

        if "PASS" in line:
            test_class = expression.search(line)[0]

            if test_class not in passed:
                passed.add(test_class)

    PASSED_FILE.write_text(
        "\n".join(sorted(passed)) + "\n"
    )
    process.wait()
    sys.exit(process.returncode)


if __name__ == "__main__":
    main()