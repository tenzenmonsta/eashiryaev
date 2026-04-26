import os
import re
import subprocess
import sys

PROXY_MARKER = "VSB_PROXY"
BACKEND_URL = "http://157.22.195.189:8000"

PROXY_BLOCK = f"""
    # VSB_PROXY
    location ~ ^/(surface|health) {{
        proxy_pass {BACKEND_URL};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120;
    }}"""


def find_nginx_conf() -> str:
    for pattern in ["var/www/eashiryaev", "eashiryaev"]:
        result = subprocess.run(
            ["grep", "-rl", pattern, "/etc/nginx"],
            capture_output=True, text=True,
        )
        lines = [l.strip() for l in result.stdout.strip().splitlines() if l.strip()]
        for line in lines:
            if any(d in line for d in ("sites-enabled", "sites-available", "conf.d")):
                return line
        if lines:
            return lines[0]

    for directory in ("/etc/nginx/sites-enabled", "/etc/nginx/conf.d"):
        if not os.path.isdir(directory):
            continue
        for fname in sorted(os.listdir(directory)):
            fpath = os.path.join(directory, fname)
            if not os.path.isfile(fpath):
                continue
            try:
                with open(fpath) as f:
                    content = f.read()
                if "listen 80" in content or "listen 443" in content:
                    return fpath
            except OSError:
                continue
    return ""


def main() -> None:
    conf_path = find_nginx_conf()

    if not conf_path or not os.path.exists(conf_path):
        print("nginx config not found")
        sys.exit(1)

    with open(conf_path) as f:
        content = f.read()

    if PROXY_MARKER in content:
        print(f"already configured in {conf_path}")
        sys.exit(0)

    last_brace = content.rfind("}")
    if last_brace == -1:
        print("no closing brace found")
        sys.exit(1)

    new_content = content[:last_brace] + PROXY_BLOCK + "\n" + content[last_brace:]
    with open(conf_path, "w") as f:
        f.write(new_content)

    print(f"proxy added to {conf_path}")


if __name__ == "__main__":
    main()
