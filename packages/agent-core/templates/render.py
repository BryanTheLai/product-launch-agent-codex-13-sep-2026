#!/usr/bin/env python3
"""
Python Jinja2 template renderer for product launch agent prompts.
Allows Python tools and scripts to render the exact same .jinja templates.
"""
import sys
import json
from pathlib import Path
import jinja2

TEMPLATES_DIR = Path(__file__).parent.resolve()

def get_env():
    return jinja2.Environment(
        loader=jinja2.FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=False,
        trim_blocks=True,
        lstrip_blocks=True,
    )

def render_template(template_name: str, context: dict) -> str:
    env = get_env()
    template = env.get_template(template_name)
    return template.render(**context)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: py render.py <template_rel_path> '<json_context>'")
        sys.exit(1)
    template_path = sys.argv[1]
    context = json.loads(sys.argv[2])
    print(render_template(template_path, context))
